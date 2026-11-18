# Registry names are global and only letters and digits.
resource "random_string" "suffix" {
  length  = 4
  special = false
  upper   = false
}

resource "azurerm_container_registry" "this" {
  #checkov:skip=CKV_AZURE_139:Private endpoints need the Premium tier (about $50 a month). The registry only accepts Entra ID tokens, with the admin user and anonymous pull off
  #checkov:skip=CKV_AZURE_163:Defender scanning is a paid add-on. CI scans every image with Trivy before it is pushed
  #checkov:skip=CKV_AZURE_164:Content trust needs the Premium tier
  #checkov:skip=CKV_AZURE_165:Geo-replication needs the Premium tier and a second region
  #checkov:skip=CKV_AZURE_166:Quarantine needs the Premium tier. CI scans images before they are pushed
  #checkov:skip=CKV_AZURE_167:Untagged manifest retention needs the Premium tier
  #checkov:skip=CKV_AZURE_233:Zone redundancy needs the Premium tier
  #checkov:skip=CKV_AZURE_237:Dedicated data endpoints need the Premium tier
  name                   = "${replace(var.prefix, "-", "")}${random_string.suffix.result}"
  resource_group_name    = var.resource_group_name
  location               = var.location
  sku                    = "Basic"
  admin_enabled          = false
  anonymous_pull_enabled = false
  tags                   = var.tags
}
