resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-user-pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }
}

resource "aws_cognito_user_pool_client" "frontend" {
  name         = "${var.project_name}-frontend"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  callback_urls = [local.webapp_url, "http://localhost:4200"]
  logout_urls   = [local.webapp_url, "http://localhost:4200"]

  supported_identity_providers = ["COGNITO"]
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "mya-fullstack-serverless-auth"
  user_pool_id = aws_cognito_user_pool.main.id
}
