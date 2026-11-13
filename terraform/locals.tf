locals {
  tags = merge(
    {
      project     = "hoard"
      owner       = var.prefix
      environment = "formative3"
      managed_by  = "terraform"
    },
    var.tags,
  )
}
