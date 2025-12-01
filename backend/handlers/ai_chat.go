package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"starter/backend/database"
	"starter/backend/models"

	"github.com/gin-gonic/gin"
)

// ChatRequest represents the incoming chat request
type ChatRequest struct {
	Message string `json:"message" binding:"required"`
	StoreID uint   `json:"store_id,omitempty"`
}

// ChatResponse represents the chat response
type ChatResponse struct {
	Response string                 `json:"response"`
	Data     map[string]interface{} `json:"data,omitempty"`
	Intent   string                 `json:"intent,omitempty"`
}

// GroqRequest represents the request to Groq API
type GroqRequest struct {
	Model       string        `json:"model"`
	Messages    []GroqMessage `json:"messages"`
	Temperature float64       `json:"temperature,omitempty"`
	MaxTokens   int           `json:"max_tokens,omitempty"`
}

type GroqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// GroqResponse represents the response from Groq API
type GroqResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error,omitempty"`
}

// IntentResponse represents the parsed intent
type IntentResponse struct {
	Intent     string                 `json:"intent"`
	Parameters map[string]interface{} `json:"parameters"`
}

// AIChatHandler handles AI chat requests
func AIChatHandler(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message is required"})
		return
	}

	// Get user from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get user's store if not provided
	var user models.User
	if err := database.DB.Preload("Store").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
		return
	}

	storeID := req.StoreID
	if storeID == 0 && user.StoreID != nil {
		storeID = *user.StoreID
	}

	// Get Groq API Key from environment or settings
	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		// Try to get from settings
		var setting models.Setting
		if err := database.DB.Where("key = ?", "groq_api_key").First(&setting).Error; err == nil {
			apiKey = setting.Value
		}
	}

	if apiKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":    "AI service not configured",
			"response": "Maaf, layanan AI belum dikonfigurasi. Silakan hubungi administrator untuk mengatur API Key Groq di Settings.\n\n💡 Dapatkan API Key gratis di: console.groq.com",
		})
		return
	}

	// Step 1: Analyze intent with Groq
	intent, err := analyzeIntent(apiKey, req.Message)
	if err != nil {
		log.Printf("AI Chat Error (analyzeIntent): %v", err)

		// User-friendly error messages
		errorMsg := "Maaf, saya mengalami kendala saat memproses permintaan Anda."
		if strings.Contains(err.Error(), "rate limit") || strings.Contains(err.Error(), "429") || strings.Contains(err.Error(), "quota") {
			errorMsg = "⏳ Layanan AI sedang sibuk. Silakan tunggu beberapa detik dan coba lagi."
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":    err.Error(),
			"response": errorMsg,
		})
		return
	} // Step 2: Query database based on intent
	data, err := queryDataByIntent(intent, storeID, user)
	if err != nil {
		log.Printf("AI Chat Error (queryDataByIntent): %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":    err.Error(),
			"response": "Maaf, gagal mengambil data yang diminta.",
		})
		return
	}

	// Step 3: Generate response with Gemini using the data
	response, err := generateResponse(apiKey, req.Message, intent, data)
	if err != nil {
		log.Printf("AI Chat Error (generateResponse): %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":    err.Error(),
			"response": "Maaf, gagal membuat respons.",
		})
		return
	}

	c.JSON(http.StatusOK, ChatResponse{
		Response: response,
		Data:     data,
		Intent:   intent.Intent,
	})
}

func analyzeIntent(apiKey, message string) (*IntentResponse, error) {
	systemPrompt := `Kamu adalah asisten AI untuk sistem POS (Point of Sale). 
Analisis pertanyaan user dan tentukan intent serta parameter yang diperlukan.

Daftar intent yang tersedia:
- get_sales_today: Mengambil data penjualan hari ini
- get_sales_summary: Mengambil ringkasan penjualan (bisa dengan rentang tanggal)
- get_top_products: Mengambil produk terlaris
- get_low_stock: Mengambil produk dengan stok rendah
- get_out_of_stock: Mengambil produk yang stoknya habis
- get_top_customers: Mengambil customer dengan pembelian terbanyak
- get_customer_count: Mengambil jumlah customer
- get_product_count: Mengambil jumlah produk
- get_monthly_revenue: Mengambil pendapatan bulanan
- search_products: Mencari produk berdasarkan nama
- search_customers: Mencari customer berdasarkan nama
- general_chat: Pertanyaan umum yang tidak memerlukan data

Parameter yang mungkin:
- date_from: Tanggal mulai (format: YYYY-MM-DD)
- date_to: Tanggal akhir (format: YYYY-MM-DD)
- limit: Jumlah data yang diambil
- search_term: Kata kunci pencarian
- period: Periode (today, week, month, year)

Jawab HANYA dalam format JSON seperti ini:
{"intent": "nama_intent", "parameters": {"key": "value"}}

Contoh:
User: "Data penjualan hari ini"
Response: {"intent": "get_sales_today", "parameters": {}}

User: "Produk apa yang stoknya menipis?"
Response: {"intent": "get_low_stock", "parameters": {"limit": 10}}

User: "Cari produk Indomie"
Response: {"intent": "search_products", "parameters": {"search_term": "Indomie"}}

User: "Halo, apa kabar?"
Response: {"intent": "general_chat", "parameters": {}}`

	prompt := fmt.Sprintf("%s\n\nUser: %s", systemPrompt, message)

	resp, err := callGroq(apiKey, prompt)
	if err != nil {
		return nil, err
	}

	// Parse the JSON response
	var intent IntentResponse
	// Clean the response (remove markdown code blocks if any)
	cleanResp := strings.TrimSpace(resp)
	cleanResp = strings.TrimPrefix(cleanResp, "```json")
	cleanResp = strings.TrimPrefix(cleanResp, "```")
	cleanResp = strings.TrimSuffix(cleanResp, "```")
	cleanResp = strings.TrimSpace(cleanResp)

	if err := json.Unmarshal([]byte(cleanResp), &intent); err != nil {
		// If parsing fails, default to general chat
		return &IntentResponse{
			Intent:     "general_chat",
			Parameters: make(map[string]interface{}),
		}, nil
	}

	return &intent, nil
}

func queryDataByIntent(intent *IntentResponse, storeID uint, user models.User) (map[string]interface{}, error) {
	data := make(map[string]interface{})
	today := time.Now().Format("2006-01-02")

	switch intent.Intent {
	case "get_sales_today":
		var sales []models.Sale
		query := database.DB.Preload("Store").Preload("Customer").Preload("Cashier").
			Where("DATE(created_at) = ?", today)
		if storeID > 0 {
			query = query.Where("store_id = ?", storeID)
		}
		query.Order("created_at DESC").Limit(20).Find(&sales)

		var totalRevenue float64
		var totalTransactions int64
		countQuery := database.DB.Model(&models.Sale{}).Where("DATE(created_at) = ?", today)
		if storeID > 0 {
			countQuery = countQuery.Where("store_id = ?", storeID)
		}
		countQuery.Count(&totalTransactions)

		sumQuery := database.DB.Model(&models.Sale{}).Where("DATE(created_at) = ?", today)
		if storeID > 0 {
			sumQuery = sumQuery.Where("store_id = ?", storeID)
		}
		sumQuery.Select("COALESCE(SUM(total_amount), 0)").Scan(&totalRevenue)

		data["sales"] = sales
		data["total_transactions"] = totalTransactions
		data["total_revenue"] = totalRevenue
		data["date"] = today

	case "get_sales_summary":
		dateFrom := today
		dateTo := today
		if v, ok := intent.Parameters["date_from"].(string); ok && v != "" {
			dateFrom = v
		}
		if v, ok := intent.Parameters["date_to"].(string); ok && v != "" {
			dateTo = v
		}
		if v, ok := intent.Parameters["period"].(string); ok {
			switch v {
			case "week":
				dateFrom = time.Now().AddDate(0, 0, -7).Format("2006-01-02")
			case "month":
				dateFrom = time.Now().AddDate(0, -1, 0).Format("2006-01-02")
			case "year":
				dateFrom = time.Now().AddDate(-1, 0, 0).Format("2006-01-02")
			}
		}

		var totalRevenue float64
		var totalTransactions int64
		query := database.DB.Model(&models.Sale{}).
			Where("DATE(created_at) >= ? AND DATE(created_at) <= ?", dateFrom, dateTo)
		if storeID > 0 {
			query = query.Where("store_id = ?", storeID)
		}
		query.Count(&totalTransactions)
		query.Select("COALESCE(SUM(total_amount), 0)").Scan(&totalRevenue)

		data["total_transactions"] = totalTransactions
		data["total_revenue"] = totalRevenue
		data["date_from"] = dateFrom
		data["date_to"] = dateTo

	case "get_top_products":
		limit := 10
		if v, ok := intent.Parameters["limit"].(float64); ok {
			limit = int(v)
		}

		type TopProduct struct {
			ProductID   uint    `json:"product_id"`
			ProductName string  `json:"product_name"`
			TotalQty    int     `json:"total_qty"`
			TotalSales  float64 `json:"total_sales"`
		}

		var topProducts []TopProduct
		query := database.DB.Table("sale_items").
			Select("sale_items.product_id, products.name as product_name, SUM(sale_items.quantity) as total_qty, SUM(sale_items.total_price) as total_sales").
			Joins("LEFT JOIN products ON products.id = sale_items.product_id").
			Joins("LEFT JOIN sales ON sales.id = sale_items.sale_id").
			Where("DATE(sales.created_at) >= ?", time.Now().AddDate(0, -1, 0).Format("2006-01-02"))
		if storeID > 0 {
			query = query.Where("sales.store_id = ?", storeID)
		}
		query.Group("sale_items.product_id, products.name").
			Order("total_qty DESC").
			Limit(limit).
			Scan(&topProducts)

		data["top_products"] = topProducts
		data["period"] = "30 hari terakhir"

	case "get_low_stock":
		limit := 10
		if v, ok := intent.Parameters["limit"].(float64); ok {
			limit = int(v)
		}

		type LowStockItem struct {
			ProductID   uint   `json:"product_id"`
			ProductName string `json:"product_name"`
			SKU         string `json:"sku"`
			Quantity    int    `json:"quantity"`
			MinStock    int    `json:"min_stock"`
			StoreName   string `json:"store_name"`
		}

		var lowStock []LowStockItem
		query := database.DB.Table("store_inventories").
			Select("store_inventories.product_id, products.name as product_name, products.sku, store_inventories.quantity, store_inventories.min_stock, stores.name as store_name").
			Joins("LEFT JOIN products ON products.id = store_inventories.product_id").
			Joins("LEFT JOIN stores ON stores.id = store_inventories.store_id").
			Where("store_inventories.quantity <= store_inventories.min_stock").
			Where("store_inventories.min_stock > 0")
		if storeID > 0 {
			query = query.Where("store_inventories.store_id = ?", storeID)
		}
		query.Order("store_inventories.quantity ASC").
			Limit(limit).
			Scan(&lowStock)

		data["low_stock_items"] = lowStock

	case "get_out_of_stock":
		type OutOfStockItem struct {
			ProductID   uint   `json:"product_id"`
			ProductName string `json:"product_name"`
			SKU         string `json:"sku"`
			StoreName   string `json:"store_name"`
		}

		var outOfStock []OutOfStockItem
		query := database.DB.Table("store_inventories").
			Select("store_inventories.product_id, products.name as product_name, products.sku, stores.name as store_name").
			Joins("LEFT JOIN products ON products.id = store_inventories.product_id").
			Joins("LEFT JOIN stores ON stores.id = store_inventories.store_id").
			Where("store_inventories.quantity <= 0")
		if storeID > 0 {
			query = query.Where("store_inventories.store_id = ?", storeID)
		}
		query.Order("products.name ASC").
			Limit(20).
			Scan(&outOfStock)

		data["out_of_stock_items"] = outOfStock

	case "get_top_customers":
		limit := 10
		if v, ok := intent.Parameters["limit"].(float64); ok {
			limit = int(v)
		}

		type TopCustomer struct {
			CustomerID   uint    `json:"customer_id"`
			CustomerName string  `json:"customer_name"`
			TotalSpent   float64 `json:"total_spent"`
			TotalOrders  int     `json:"total_orders"`
		}

		var topCustomers []TopCustomer
		query := database.DB.Table("sales").
			Select("sales.customer_id, customers.name as customer_name, SUM(sales.total_amount) as total_spent, COUNT(*) as total_orders").
			Joins("LEFT JOIN customers ON customers.id = sales.customer_id").
			Where("sales.customer_id IS NOT NULL")
		if storeID > 0 {
			query = query.Where("sales.store_id = ?", storeID)
		}
		query.Group("sales.customer_id, customers.name").
			Order("total_spent DESC").
			Limit(limit).
			Scan(&topCustomers)

		data["top_customers"] = topCustomers

	case "get_customer_count":
		var count int64
		database.DB.Model(&models.Customer{}).Where("status = ?", "active").Count(&count)
		data["customer_count"] = count

	case "get_product_count":
		var count int64
		database.DB.Model(&models.Product{}).Where("status = ?", "active").Count(&count)
		data["product_count"] = count

	case "get_monthly_revenue":
		startOfMonth := time.Date(time.Now().Year(), time.Now().Month(), 1, 0, 0, 0, 0, time.Local).Format("2006-01-02")

		var totalRevenue float64
		var totalTransactions int64
		query := database.DB.Model(&models.Sale{}).
			Where("DATE(created_at) >= ?", startOfMonth)
		if storeID > 0 {
			query = query.Where("store_id = ?", storeID)
		}
		query.Count(&totalTransactions)
		query.Select("COALESCE(SUM(total_amount), 0)").Scan(&totalRevenue)

		data["total_revenue"] = totalRevenue
		data["total_transactions"] = totalTransactions
		data["month"] = time.Now().Format("January 2006")

	case "search_products":
		searchTerm := ""
		if v, ok := intent.Parameters["search_term"].(string); ok {
			searchTerm = v
		}

		var products []models.Product
		database.DB.Where("name ILIKE ? OR sku ILIKE ?", "%"+searchTerm+"%", "%"+searchTerm+"%").
			Where("status = ?", "active").
			Limit(10).
			Find(&products)

		data["products"] = products
		data["search_term"] = searchTerm

	case "search_customers":
		searchTerm := ""
		if v, ok := intent.Parameters["search_term"].(string); ok {
			searchTerm = v
		}

		var customers []models.Customer
		database.DB.Where("name ILIKE ? OR phone ILIKE ?", "%"+searchTerm+"%", "%"+searchTerm+"%").
			Where("status = ?", "active").
			Limit(10).
			Find(&customers)

		data["customers"] = customers
		data["search_term"] = searchTerm

	case "general_chat":
		// No data needed for general chat
		data["store_name"] = ""
		if storeID > 0 {
			var store models.Store
			if err := database.DB.First(&store, storeID).Error; err == nil {
				data["store_name"] = store.Name
			}
		}
		data["user_name"] = user.FullName
	}

	return data, nil
}

func generateResponse(apiKey, originalMessage string, intent *IntentResponse, data map[string]interface{}) (string, error) {
	dataJSON, _ := json.MarshalIndent(data, "", "  ")

	systemPrompt := `Kamu adalah asisten AI yang ramah untuk sistem POS (Point of Sale) bernama "Go POS Assistant".
Tugasmu adalah menjawab pertanyaan user dengan bahasa Indonesia yang natural dan informatif.

Panduan:
1. Gunakan format yang mudah dibaca (gunakan emoji untuk memperjelas)
2. Jika ada data angka, format dengan pemisah ribuan (contoh: 1.250.000)
3. Berikan insight atau saran jika relevan
4. Jika data kosong, sampaikan dengan sopan
5. Gunakan bahasa yang ramah dan profesional
6. Untuk mata uang, gunakan format "Rp X.XXX.XXX"

Kamu sedang dalam konteks sistem POS dengan data berikut:`

	prompt := fmt.Sprintf(`%s

Intent yang terdeteksi: %s
Data yang ditemukan:
%s

Pertanyaan user: %s

Berikan respons yang informatif dan ramah:`, systemPrompt, intent.Intent, string(dataJSON), originalMessage)

	return callGroq(apiKey, prompt)
}

func callGroq(apiKey, prompt string) (string, error) {
	url := "https://api.groq.com/openai/v1/chat/completions"

	reqBody := GroqRequest{
		Model: "openai/gpt-oss-120b",
		Messages: []GroqMessage{
			{
				Role:    "user",
				Content: prompt,
			},
		},
		Temperature: 0.7,
		MaxTokens:   1024,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %v", err)
	}

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Create request with authorization header
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	// Retry logic for rate limiting
	maxRetries := 3
	var lastErr error

	for attempt := 0; attempt < maxRetries; attempt++ {
		if attempt > 0 {
			// Wait before retry (exponential backoff)
			waitTime := time.Duration(attempt*5) * time.Second
			log.Printf("AI Chat: Rate limited, waiting %v before retry (attempt %d/%d)", waitTime, attempt+1, maxRetries)
			time.Sleep(waitTime)
		}

		resp, err := client.Do(req)
		if err != nil {
			lastErr = fmt.Errorf("failed to call Groq API: %v", err)
			continue
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			lastErr = fmt.Errorf("failed to read response: %v", err)
			continue
		}

		// Handle rate limiting (429)
		if resp.StatusCode == http.StatusTooManyRequests {
			lastErr = fmt.Errorf("rate limit exceeded, please wait a moment and try again")
			continue
		}

		// Log response for debugging
		if resp.StatusCode != http.StatusOK {
			lastErr = fmt.Errorf("groq API returned status %d: %s", resp.StatusCode, string(body))
			// Don't retry for non-rate-limit errors
			if resp.StatusCode != http.StatusTooManyRequests {
				return "", lastErr
			}
			continue
		}

		var groqResp GroqResponse
		if err := json.Unmarshal(body, &groqResp); err != nil {
			return "", fmt.Errorf("failed to parse response: %v, body: %s", err, string(body))
		}

		if groqResp.Error != nil {
			return "", fmt.Errorf("groq API error: %s", groqResp.Error.Message)
		}

		if len(groqResp.Choices) > 0 {
			return groqResp.Choices[0].Message.Content, nil
		}

		return "", fmt.Errorf("no response from Groq")
	}

	return "", lastErr
}
