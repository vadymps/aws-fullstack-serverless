terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

locals {
  webapp_url         = "https://${aws_cloudfront_distribution.site.domain_name}"
  cognito_client_id  = aws_cognito_user_pool_client.frontend.id
  cognito_issuer_url = "https://${aws_cognito_user_pool.main.endpoint}"
  cognito_scopes     = join(" ", aws_cognito_user_pool_client.frontend.allowed_oauth_scopes)
}
