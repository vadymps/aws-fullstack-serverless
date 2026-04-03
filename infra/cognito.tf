resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-user-pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  schema {
    name                = "given_name"
    attribute_data_type = "String"
    mutable             = true
    required            = false
  }

  schema {
    name                = "family_name"
    attribute_data_type = "String"
    mutable             = true
    required            = false
  }

  schema {
    name                = "picture"
    attribute_data_type = "String"
    mutable             = true
    required            = false

    string_attribute_constraints {
      max_length = "2048"
      min_length = "0"
    }
  }

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  lifecycle {
    ignore_changes = [schema]
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
  allowed_oauth_scopes = ["email","openid","profile","aws.cognito.signin.user.admin"]

  callback_urls = [local.cloudfront_url, "http://localhost:4200"]
  logout_urls   = [local.cloudfront_url, "http://localhost:4200"]

  read_attributes = [
    "email",
    "given_name",
    "family_name",
    "picture"
  ]

  write_attributes = [
    "email",
    "given_name",
    "family_name",
    "picture"
  ]

  supported_identity_providers = ["COGNITO"]
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "mya-fullstack-serverless-auth"
  user_pool_id = aws_cognito_user_pool.main.id
}
