resource "azurerm_private_dns_zone" "this" {
  name                = "${var.prefix}.private.postgres.database.azure.com"
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "this" {
  name                  = "${var.prefix}-pg-link"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.this.name
  virtual_network_id    = var.vnet_id
  tags                  = var.tags
}

# Letters and digits only, because the password sits inside a Postgres URL.
resource "random_password" "admin" {
  length  = 32
  special = false
}

resource "azurerm_postgresql_flexible_server" "this" {
  #checkov:skip=CKV_AZURE_136:Geo-redundant backup doubles the backup cost and needs a paired region the student subscription may not allow. Local backups are kept for 7 days
  #checkov:skip=CKV2_AZURE_57:The server uses VNet integration instead of a private endpoint: it lives in a delegated subnet with public access off, so it has no public address either way
  name                          = "${var.prefix}-pg"
  resource_group_name           = var.resource_group_name
  location                      = var.location
  version                       = "16"
  sku_name                      = var.sku_name
  storage_mb                    = 32768
  backup_retention_days         = 7
  delegated_subnet_id           = var.subnet_id
  private_dns_zone_id           = azurerm_private_dns_zone.this.id
  public_network_access_enabled = false
  administrator_login           = var.admin_username
  administrator_password        = random_password.admin.result
  tags                          = var.tags

  depends_on = [azurerm_private_dns_zone_virtual_network_link.this]

  lifecycle {
    # Azure picks the zone on create and may move it during maintenance.
    ignore_changes = [zone]
  }
}

resource "azurerm_postgresql_flexible_server_database" "this" {
  name      = var.database_name
  server_id = azurerm_postgresql_flexible_server.this.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}
