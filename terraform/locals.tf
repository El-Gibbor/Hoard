locals {
  tags = merge(
    {
      project     = "hoard"
      owner       = var.prefix
      environment = "production"
      managed_by  = "terraform"
    },
    var.tags,
  )
}
