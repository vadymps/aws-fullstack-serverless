resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "lambda_profile" {
  statement {
    effect = "Allow"
    actions = [
      "s3:PutObject"
    ]
    resources = ["${aws_s3_bucket.avatars.arn}/*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "cognito-idp:GetUser",
      "cognito-idp:UpdateUserAttributes"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "lambda_profile" {
  name   = "${var.project_name}-lambda-profile"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_profile.json
}

resource "aws_lambda_function" "lambda" {
  function_name = "${var.project_name}-lambda"
  role          = aws_iam_role.lambda.arn
  runtime       = "python3.12"
  handler       = "app.handler"
  timeout       = 5

  filename         = "${path.module}/lambda.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda.zip")

  environment {
    variables = {
      MONGODB_URI    = var.mongodb_uri
      MONGODB_DB     = "sample_mflix"
      AVATARS_BUCKET = local.s3_avatars_bucket
    }
  }
}

resource "aws_lambda_permission" "api" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
