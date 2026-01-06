package routes

import (
	// "printenvelope/constants"
	"printenvelope/constants"
	"printenvelope/controllers/auth"
	"printenvelope/controllers/order"
	"printenvelope/controllers/print"
	printclient "printenvelope/controllers/print-client"
	"printenvelope/logger"
	"printenvelope/middleware"

	//"printenvelope/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"gorm.io/gorm"
)

func SetupRoutes(app *fiber.App, db *gorm.DB) {
	// ssoClient := SsoHttpServices.NewClient(os.Getenv("SSO_BASE_URL"))
	// ekdakClient := EkdakHttpServices.NewClient(os.Getenv("EKDAK_BACKEND_API_URL"))
	asyncLogger := logger.NewAsyncLogger(db)
	authController := auth.NewAuthController(db, asyncLogger)
	orderController := order.NewOrderController(db, asyncLogger)
	printController := print.NewPrintController(db, asyncLogger)
	printClientController := printclient.NewPrintClientController(printclient.GetService())
	// kafkaController := product.NewKafkaController(db, asyncLogger)
	// cloudPrintController := product.NewCloudPrintController(db, asyncLogger)
	// userController := user.NewUserController(db, asyncLogger)
	go asyncLogger.ProcessLog()

	// Index route
	app.Get("/", func(c *fiber.Ctx) error {
		return c.Render("index", fiber.Map{
			"title": "Home",
		})
	})

	// WebSocket route for print clients
	app.Get("/ws", websocket.New(printclient.ConnectWS))

	/*=============================================================================
	| Public Routes
	===============================================================================*/
	api := app.Group("/api")
	api.Post("/login", authController.Login)

	/*=============================================================================
	| Protected Routes
	===============================================================================*/
	auth := api.Group("/auth")
	auth.Post("/register-admin", middleware.RequirePermissions(
		constants.PermSuperAdminFull,
	), authController.RegisterAdmin)
	auth.Post("/register-operator", middleware.RequirePermissions(
		constants.PermAdminFull,
	), authController.RegisterOperator)
	// auth.Get("/profile", user.GetUserInfo)
	auth.Post("/logout", authController.LogOut)

	order := api.Group("/order")
	order.Get("/order-list", middleware.RequirePermissions(
		constants.PermSuperAdminFull,
		constants.PermAdminFull,
		constants.PermOperatorFull,
	), orderController.OrderList)

	order.Post("/batch-order", middleware.RequirePermissions(
		constants.PermOperatorFull,
	), orderController.BatchOrderCreate)

	printGroup := api.Group("/print")
	printGroup.Post("/print-batch", middleware.RequirePermissions(
		constants.PermOperatorFull,
	), printController.PrintBatch)

	printGroup.Post("/print-envelope", middleware.RequirePermissions(
		constants.PermOperatorFull,
	), printController.PrintEnvelope)

	// Print Client routes (for managing connected printers)
	printClientGroup := api.Group("/print-client")
	printClientGroup.Get("/metrics", printClientController.GetMetrics)
	// printClientGroup.Post("/send-job", middleware.RequirePermissions(
	// 	constants.PermOperatorFull,
	// ), printClientController.SendPrintJob)
	printClientGroup.Get("/connected-printers", middleware.RequirePermissions(
		constants.PermAdminFull,
		constants.PermOperatorFull,
	), printClientController.GetConnectedPrinters)
	// printClientGroup.Delete("/disconnect/:printer_id", middleware.RequirePermissions(
	// 	constants.PermAdminFull,
	// ), printClientController.DisconnectPrinter)

}
