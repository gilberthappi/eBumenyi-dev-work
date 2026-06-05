export interface IHospital {
  id: string;
  name: string;
  location: string;
  contact?: string;
  chwSupervisor?: string;
   chwSupervisorContact?: string;
   totalChws: number,
    activeChws: number,
    districtsCovered: string[];
  email?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  id: string;
  email: string | null;
  password?: string;
  fullNames: string;
  phoneNumber: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  NID: string;
  gender: string;
  birthdate: string | null;
  createdAt: string;
  updatedAt: string;
  otp: string | null;
  otpExpiresAt: string | null;
  photo: string;
  video: string | null;
  audio: string | null;
  bio: string | null;
  industry: string | null;
  hospital: IHospital | null;
  userRoles: IRoles[];
}

// Lightweight projection for embedding a company-linked user on related resources
export type ICompanyUserPreview = Pick<
  IUser,
  "id" | "fullNames"| "email"
>;

export interface IUserRequest extends Omit<IUser, "id"> {
  id?: string;
}

export interface IRoles {
  id: string;
  userId: string;
  name: string;
}

export interface ICompany {
  id: string;
  name: string;
  country: string;
  province: string;
  district: string;
  sector: string;
  phoneNumber: string;
  email: string;
  industry: string;
  website: string;
  TIN: string;
  type: string;
  certificate: string;
  logo: string;
  isActive: boolean;
}

export interface ICompanyResponse {
  company: ICompany;
  contactPerson: IContactPerson;
}

// Form interfaces for file uploads
export interface ICompanyForm
  extends Omit<ICompany, "id" | "certificate" | "logo" | "isActive"> {
  id?: string;
  certificate?: FileList;
  logo?: FileList;
}

export interface IContactPersonForm
  extends Omit<IContactPerson, "id" | "idAttachment" | "isActive"> {
  id?: string;
  idAttachment?: FileList;
}

export interface ICompanyResponseForm {
  company: ICompanyForm;
  contactPerson: IContactPersonForm;
}

export interface ICompanyRequest extends Omit<ICompany, "id"> {
  id?: string;
}

export interface IContactPerson {
  id: string;
  fullNames: string;
  email: string;
  title: string;
  idNumber: string;
  phoneNumber: string;
  idAttachment: string;
  isActive: boolean;
}

export interface IContact {
  id: string;
  name: string;
  email: string;
  company?: string;
  message: string;
  status?: "pending" | "resolved";
  conversationId?: string;
  replies?: IContactReply[];
  createdAt: string;
  updatedAt: string;
}

export interface IContactReply {
  id: string;
  message: string;
  adminName: string;
  createdAt: string;
}

export interface IContactRequest extends Omit<IContact, "id"> {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStaff {
  id: string;
  fullNames: string;
  email: string;
  idNumber: string;
  createdAt: Date;
  phoneNumber: string;
  updatedAt: Date;
  idAttachment: string | null;
  title: string;
  photo: string;
  role: string;
}

export interface IStaffRequest extends Omit<IStaff, "id"> {
  id?: string;
}
export interface AuthState extends Pick<IUser, "name" | "email" | "phone"> {
  token: string;
  roles: string[];
  industry?: string;
}

export interface IRoute {
  path: string;
  element: ComponentType<unknown>;
  allowedPermissionGroup?: PermissionGroup;
  allowedPermissions?: Permission[];
  superAdmin?: boolean;
}

export interface IPermissionsGroup {
  group: string;
  permissions: string[];
}

export type IUUID = string;

export interface IPaged<T> {
  data: T;
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface IUsersResponse {
  data: IUser[];
  totalItems: number;
}

export enum ProductCategory {
  WOMENS_FASHION,
  MENS_FASHION,
  FASHION,
  ELECTRONICS,
  FURNITURES,
  MADE_IN_RWANDA,
  HOME_AND_LIVING,
  SUPERMARKETING,
  MOBILES_AND_TABLETS,
  COMPUTERS_AND_GAMING,
  HEALTH_AND_BEAUTY,
  SPORTS_EQUIPMENT,
  ART_AND_ENTERTAINMENT,
  RESTAURANTS,
  JEWELRY_AND_WATCHES,
  KIDS_AND_BABIES,
  AUTO_SPARE_PARTS,
  VEHICLES_SHOPPING,
}

export interface IProduct {
  id: string;
  name: string;
  isFeatured: boolean;
  description: string;
  price: number;
  teaser: string;
  model: string;
  warranty: string;
  featuresOne?: string;
  featuresTwo?: string;
  featuresThree?: string;
  featuresFour?: string;
  featuresFive?: string;
  featuresFix?: string;
  featuresSeven?: string;
  featuresEight?: string;
  featuresNine?: string;
  featuresTen?: string;
  discountPercentage: number;
  category: ProductCategory | string;
  brand: string;
  stockQuantity: number;
  isActive: boolean;
  thumbnail: string;
  galleryImages: string[];
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductRequest extends Omit<IProduct, "id" | "galleryImages"> {
  id?: string;
  galleryImages: string[];
}

export interface IOrder {
  id: string;
  orderNumber: number;
  status: string;
  totalAmount: number;
  subTotal: number;
  discount: number | null;
  deliveryFee: number | null;
  createdAt: string;
  updatedAt: string;
  orderItems: IOrderItem[];
  payment: IPayment;
  delivery: IDelivery;
}

export interface IOrderItems {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  createdAt: Date;
  updatedAt: Date;
  product: IProduct;
}

export interface IOrderItemReq {
  productId: string;
  quantity: number;
}
export interface IOrderRequest {
  orderItems: IOrderItemReq[];
}

export interface IPayment {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string;
  accountNumber: string;
  accountProvider: string;
  refId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITransaction {
  id: string;
  clientId: string;
  companyId: string;
  amount: number;
  date: string;
  client?: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  company?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

enum PaymentMethod {
  CARD,
  CASH_ON_DELIVERY,
  MOBILE_MONEY,
  AIRTEL_MONEY,
  BANK_TRANSFER,
  MTN_MOBILE_MONEY,
}

export interface CardFormData {
  orderId: string;
  cardName: string;
  cardNumber: string;
  expDate: string;
  cvv: string;
  method: "CARD";
}

export interface MobileFormData {
  orderId: string;
  accountNumber: string;
  amount: number;
  method: "MTN_MOBILE_MONEY" | "AIRTEL_MONEY" | "";
}

export interface DeliveryFormData {
  orderId: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  customerPhone: string;
}

export interface ISupplier {
  id: string;
  full_names: string;
  phone_number: string;
  location: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPatient {
  id: string;
  name: string;
  identificationType: string;
  phone: string;
  gender: string;
  birthDate: Date;
  patientNO: string;
  NID: string;
  gender: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  address: IPatientAddress[];
  insuranceCards: IInsuranceCards[];
}

export interface IPatientAddress {
  id: string;
  patientId: string;
  city: string;
  street: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInsuranceCards {
  id: string;
  patientId: string;
  companyId: string;
  insuranceId: string;
  cardNumber: string;
  expireDate: Date;
  beneficiary: string;
  isOwner: boolean;
  expired: boolean;
  createdAt: Date;
  updatedAt: Date;
  insuranceDetails: IInsuranceDetails[];
  insurance: IInsurance;
}

export interface IInsuranceDetails {
  id: string;
  insuranceCardId: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInsurance {
  id: string;
  name: string;
  companyId: string;
  percentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInsuranceRequest {
  name: string;
  percentage: number;
}

export interface IInsuranceCards {
  id: string;
  patientId: string;
  companyId: string;
  insuranceId: string;
  cardNumber: string;
  expireDate: Date;
  beneficiary: string;
  isOwner: boolean;
  expired: boolean;
  createdAt: Date;
  updatedAt: Date;
  insuranceDetails: IInsuranceDetails[];
  insurance: IInsurance;
}

export interface IPurchaseOrderForStockReceipt {
  supplierId: string;
  supplierName: string;
  items: IPurchaseOrderItemForStockReceipt[];
}

export interface IPurchaseOrderItemForStockReceipt {
  purchaseOrderItemId: string;
  itemId: string;
  itemName: string;
  sku: string;
  orderedQuantity: number;
  costPrice: number;
  receivedQuantity: number;
  remainingQuantity: number;
  unitCost: number;
  supplierId: string;
  supplierName: string;
}

export interface ICreateStockEntryRequest {
  itemId: string;
  purchaseOrderItemId: string;
  purchaseOrderId: string;
  invoiceNo?: string;
  supplierId: string;
  dateReceived: string;
  quantityReceived: number;
  expiryDate?: string;
  unitCost: number;
  packSize?: number;
  uom: string;
  tempReq: string;
  currency: string;
  condition: string;
  warehouseId: string;
  specialHandlingNotes?: string;
  remarksNotes?: string;
}

export interface CreateStockReceiptFromPODto {
  purchaseOrderItemId: string;
  quantityReceived: number;
  unitCost?: number;
  expiryDate?: Date;
  invoiceNo?: string;
  warehouseId: string;
  condition: string;
  tempReq: string;
  uom: string;
  currency: string;
  packSize?: number;
}

export interface IBulkCreateStockReceiptsDto {
  poNumber: string;
  receipts: CreateStockReceiptFromPODto[];
}

export interface IStockEntryResponse {
  id: string;
  item: ItemResponse;
  purchaseOrderItemId: string;
  purchaseOrderId: string;
  purchaseOrder?: {
    id: string;
    poNumber: string;
  };
  invoiceNo?: string;
  supplier: SupplierResponse;
  dateReceived: string;
  expiryDate: string;
  quantityReceived: number;
  unitCost: number;
  totalCost: number;
  packSize?: number;
  currency: string;
  condition: string;
  uom: string;
  tempReq: string;
  warehouse: IWarehouseResponse;
  batchInfo?: string;
  serialNumbers?: string;
  specialHandlingNotes?: string;
  remarksNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateItemRequest {
  itemFullName: string;
  categoryId: string;
  description?: string;
  productCode?: string;
  minLevel: number;
  maxLevel: number;
  isTaxable?: boolean;
  taxCode?: "A" | "B";
  taxRate?: number;
}

export interface IUpdateItemRequest {
  itemFullName?: string;
  categoryId?: string;
  description?: string;
  productCode?: string;
  minLevel: number;
  maxLevel: number;
  isTaxable?: boolean;
  taxCode?: "A" | "B";
  taxRate?: number;
}

export interface IItemResponse {
  id: string;
  itemCodeSku: string;
  itemFullName: string;
  batchLotNumber?: string;
  serialNumber?: string;
  productCode?: string;
  category: {
    id: string;
    categoryName: string;
    description?: string;
  };
  description?: string;
  packSize?: number;
  minLevel: number;
  maxLevel: number;
  uom: string;
  temp: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  currentStock?: number;
  // Tax information
  isTaxable?: boolean;
  taxCode?: "A" | "B";
  taxRate?: number;
}

export interface ICreateSupplierRequest {
  supplierName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  address?: string;
  TIN: string;
  supplierCompanyId?: string;
}

export interface IUpdateSupplierRequest {
  supplierName?: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
  supplierCompanyId?: string;
}

export interface ISupplierResponse {
  id: string;
  supplierName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  address?: string;
  TIN: string;
  supplierCompanyId?: string;
  createdAt: Date;
}

export interface ICategoryResponse {
  id: string;
  categoryName: string;
  description?: string | null;
}

interface ICreateCategoryRequest {
  categoryName: string;
  description?: string | null;
}

interface UpdateCategoryRequest {
  categoryName: string;
  description?: string | null;
}

export interface IWarehouseResponse {
  id: string;
  warehousename: string;
  description?: string | null;
}

interface ICreateWarehouseRequest {
  warehousename: string;
  description?: string | null;
}

interface UpdateWarehouseRequest {
  warehousename: string;
  description?: string | null;
}

export interface IClient {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  sells?: ISell[];
}

export interface IClientRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ISell {
  id: string;
  clientId: string;
  companyId: string;
  totalAmount: string | number;
  taxAmount: string | number;
  notes?: string;
  company?: ICompany;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  patient?: {
    id: string;
    name: string;
    phone: string;
  };
  sellItems: SellItem[];
  // Legacy fields for backward compatibility
  itemId?: string | null;
  quantity?: number | null;
  sellPrice?: number | null;
  item?: {
    id: string;
    itemCodeSku: string;
    itemFullName: string;
    category?: {
      id: string;
      name: string;
    };
  } | null;
  // PHARMACY insurance (optional)
  patientId?: string;
  insuranceCardId?: string;
  insurancePercentage?: number;
  subtotal?: number | string;
  insuranceCoveredAmount?: number | string;
  patientPayableAmount?: number | string;
}

export interface SellItem {
  id: string;
  sellId: string;
  itemId: string;
  quantity: string | number;
  sellPrice: string | number;
  totalAmount: string | number;
  taxAmount: string | number;
  createdAt: string;
  updatedAt: string;
  item?: {
    id: string;
    itemCodeSku: string;
    itemFullName: string;
    category?: {
      id: string;
      categoryName: string;
    };
  };
}

export interface ISellRequest {
  clientId?: string;
  items: ISellItemRequest[];
  notes?: string;
  // Legacy fields for backward compatibility
  itemId?: string;
  quantity?: number;
  sellPrice?: number;
  // PHARMACY insurance (optional)
  patientId?: string;
  insuranceCardId?: string;
  insurancePercentage?: number;
  subtotal?: number;
  insuranceCoveredAmount?: number;
  patientPayableAmount?: number;
}

export interface ISellItemRequest {
  itemId: string;
  quantity: number;
  sellPrice: number;
}

export interface IPurchaseOrder {
  id: string;
  poNumber: string;
  companyId: string;
  itemId: string;
  supplierId: string;
  quantity: number;
  packSize: number;
  notes?: string;
  isDelivered: boolean;
  deliveredAt: Date | null;
  overallStatus: "NOT_YET" | "SOME_APPROVED" | "ALL_APPROVED" | "REJECTED";
  expectedDeliveryDate: string;
  createdAt: string;
  items?:
    | PurchaseOrderItem[]
    | {
        itemFullName?: string;
        itemCodeSku?: string;
      };

  suppliers?: {
    id: string;
    supplierName: string;
    email: string;
    phoneNumber: string;
  };
  stockReceipts?: {
    id: string;
    quantityReceived: number;
    dateReceived: string;
  }[];
  user: IUser;
  clientAddress?: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  item?: {
    itemFullName?: string;
    itemCodeSku?: string;
  };
  quantity: number;
  packSize: number;
}

export interface IPurchaseOrderRequest {
  items: PurchaseOrderItem[];
  supplierId: string;
  notes?: string;
  expectedDeliveryDate: string | Date;
}

export interface IClientOrderRequest {
  items: PurchaseOrderItem[];
  clientId: string;
  notes?: string;
  expectedDeliveryDate: string | Date;
  companyId?: string;
  clientAddress?: string;
}

export interface IInventoryItem {
  id: string;
  itemId: string;
  itemCodeSku: string;
  itemFullName: string;
  productCode: string;
  category: {
    id: string;
    categoryName: string;
  };
  suppliers: {
    supplierName: string;
  };
  primarySupplier: string;
  dateReceived: string;
  expiryDate?: string;
  totalQuantityReceived: number;
  currentStock: number;
  avgUnitCost: number;
  totalValue: number;
  currency: string;
  warehouse: IWarehouseResponse;
  condition: string;
  stockStatus: "LOW_STOCK" | "NORMAL" | "OVER_STOCK";
  minLevel: number;
  maxLevel: number;
  expectedSellPrice: string;
  tempReq: string;
  uom: string;
  packSize?: number;
  dateApproved?: Date;
  totalReceipts: string;
}

export interface IExpiringItem {
  id: string;
  itemId: string;
  itemCodeSku: string;
  itemFullName: string;
  productCode: string;
  category: {
    id: string;
    categoryName: string;
  };
  supplier: {
    supplierName: string;
  };
  dateReceived: string;
  expiryDate: string;
  daysUntilExpiry: number;
  urgencyLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  quantityReceived: number;
  currentStock: number;
  unitCost: number;
  totalCost: number;
  currency: string;
  warehouse: IWarehouseResponse;
  condition: string;
  expectedSellPrice?: number;
  tempReq: string;
  uom: string;
  approvedBy?: string;
  dateApproved?: Date;
}

export interface ICreateApprovalRequest {
  stockReceiptId: string;
  approvalStatus: "APPROVED" | "DISAPPROVED" | "PENDING";
  comments?: string;
  expectedSellPrice?: number;
}

export interface IUpdateApprovalRequest {
  approvalStatus?: "APPROVED" | "DISAPPROVED" | "PENDING";
  comments?: string;
  expectedSellPrice?: number;
}
