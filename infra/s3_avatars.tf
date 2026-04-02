resource "aws_s3_bucket" "avatars" {
  bucket = "${var.project_name}-user-avatars"
}

resource "aws_s3_bucket_cors_configuration" "avatars" {
  bucket = aws_s3_bucket.avatars.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "HEAD"]
    allowed_origins = [
      local.cloudfront_url, 
      local.s3_website, 
      local.apigatewayv2_api,
      "http://localhost:4200", 
      "http://localhost:3000"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_public_access_block" "avatars" {
  bucket                  = aws_s3_bucket.avatars.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "avatars" {
  statement {
    sid     = "AllowCloudFrontServicePrincipal"
    effect  = "Allow"
    actions = ["s3:GetObject"]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    resources = ["${aws_s3_bucket.avatars.arn}/*"]
  }
}

resource "aws_s3_bucket_policy" "avatars" {
  bucket = aws_s3_bucket.avatars.id
  policy = data.aws_iam_policy_document.avatars.json
}
