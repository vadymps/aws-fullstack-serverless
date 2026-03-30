resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name = aws_s3_bucket_website_configuration.site.website_endpoint
    origin_id   = "${var.project_name}-s3-website"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin {
    domain_name = replace(aws_apigatewayv2_api.http.api_endpoint, "https://", "")
    origin_id   = "${var.project_name}-http-api"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  ordered_cache_behavior {
    path_pattern           = "/api*"
    target_origin_id       = "${var.project_name}-http-api"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    compress         = true
    cache_policy_id  = data.aws_cloudfront_cache_policy.managed_caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.managed_all_viewer_except_host_header.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.strip_api_prefix.arn
    }
  }

  default_cache_behavior {
    target_origin_id       = "${var.project_name}-s3-website"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    compress         = true
    cache_policy_id  = data.aws_cloudfront_cache_policy.managed_caching_optimized.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.managed_cors_s3_origin.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

data "aws_cloudfront_cache_policy" "managed_caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_cache_policy" "managed_caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_origin_request_policy" "managed_all_viewer_except_host_header" {
  name = "Managed-AllViewerExceptHostHeader"
}

data "aws_cloudfront_origin_request_policy" "managed_cors_s3_origin" {
  name = "Managed-CORS-S3Origin"
}

resource "aws_cloudfront_function" "strip_api_prefix" {
  name    = "${var.project_name}-strip-api-prefix"
  runtime = "cloudfront-js-1.0"
  comment = "Strip /api prefix before forwarding to API Gateway"
  publish = true

  code = <<EOF
function handler(event) {
  var request = event.request;
  if (request.uri === "/api") {
    request.uri = "/";
  } else if (request.uri.startsWith("/api/")) {
    request.uri = request.uri.substring(4);
  }
  return request;
}
EOF
}
