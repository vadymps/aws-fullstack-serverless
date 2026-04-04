resource "local_file" "webapp_config" {
  filename = abspath("${path.module}/../frontend/src/assets/config.auto.json")
  content = jsonencode({
    apiUrl = "/api"
    auth = {
      clientId              = local.cognito_client_id
      issuer                = local.cognito_issuer_url
      redirectUri           = "${local.cloudfront_url}/profile"
      postLogoutRedirectUri = "${local.cloudfront_url}/profile"
      scope                 = local.cognito_scopes
    }
  })
}

resource "aws_s3_object" "config_upload" {
  bucket       = aws_s3_bucket.site.bucket
  key          = "assets/config.json"
  content      = local_file.webapp_config.content
  content_type = "application/json"
}
