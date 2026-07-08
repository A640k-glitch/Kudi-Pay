// Defines category-specific product attribute fields.
// Each entry becomes a dynamic field in the Add/Edit Product modal.

export type FieldType = 'text' | 'select' | 'number';

export interface AttributeField {
  key: string;          // stored in product.attributes
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];   // for select type
  required?: boolean;
}

export interface ProductRegistry {
  categoryLabel: string;
  icon: string;
  fields: AttributeField[];
}

export const PRODUCT_REGISTRIES: Record<string, ProductRegistry> = {
  Fashion: {
    categoryLabel: 'Fashion & Clothing',
    icon: '👗',
    fields: [
      {
        key: 'sizes',
        label: 'Available Sizes',
        type: 'text',
        placeholder: 'e.g. S, M, L, XL, XXL',
      },
      {
        key: 'color',
        label: 'Color(s)',
        type: 'text',
        placeholder: 'e.g. Black, White, Navy',
      },
      {
        key: 'gender',
        label: 'Target Gender',
        type: 'select',
        options: ['Unisex', 'Women', 'Men', 'Kids'],
      },
      {
        key: 'material',
        label: 'Material',
        type: 'text',
        placeholder: 'e.g. 100% Cotton',
      },
    ],
  },

  'Food & Beverages': {
    categoryLabel: 'Food & Beverages',
    icon: '🍱',
    fields: [
      {
        key: 'dietary',
        label: 'Dietary Type',
        type: 'select',
        options: ['None', 'Halal', 'Vegan', 'Vegetarian', 'Gluten-Free'],
      },
      {
        key: 'weight',
        label: 'Weight / Volume',
        type: 'text',
        placeholder: 'e.g. 500g, 1L, per plate',
      },
      {
        key: 'shelfLife',
        label: 'Shelf Life',
        type: 'text',
        placeholder: 'e.g. 3 days, 6 months',
      },
      {
        key: 'servingSize',
        label: 'Serving Size',
        type: 'text',
        placeholder: 'e.g. Serves 2, per portion',
      },
    ],
  },

  Electronics: {
    categoryLabel: 'Electronics',
    icon: '📱',
    fields: [
      {
        key: 'condition',
        label: 'Condition',
        type: 'select',
        options: ['New', 'UK Used', 'Nigerian Used', 'Refurbished'],
      },
      {
        key: 'warranty',
        label: 'Warranty Period',
        type: 'select',
        options: ['No Warranty', '1 Month', '3 Months', '6 Months', '1 Year'],
      },
      {
        key: 'brand',
        label: 'Brand',
        type: 'text',
        placeholder: 'e.g. Samsung, Apple, Tecno',
      },
      {
        key: 'model',
        label: 'Model / Spec',
        type: 'text',
        placeholder: 'e.g. iPhone 13, 128GB',
      },
    ],
  },

  Beauty: {
    categoryLabel: 'Health & Beauty',
    icon: '💄',
    fields: [
      {
        key: 'skinType',
        label: 'Suitable For',
        type: 'select',
        options: ['All Skin Types', 'Oily Skin', 'Dry Skin', 'Combination', 'Sensitive'],
      },
      {
        key: 'volume',
        label: 'Size / Volume',
        type: 'text',
        placeholder: 'e.g. 50ml, 200g',
      },
      {
        key: 'brand',
        label: 'Brand',
        type: 'text',
        placeholder: 'e.g. Neutrogena, Zaron',
      },
    ],
  },

  Services: {
    categoryLabel: 'Services',
    icon: '🛠️',
    fields: [
      {
        key: 'duration',
        label: 'Service Duration',
        type: 'text',
        placeholder: 'e.g. 1 hour, Half day',
      },
      {
        key: 'location',
        label: 'Service Location',
        type: 'select',
        options: ['Remote / Online', 'At Your Location', 'At Our Location', 'Flexible'],
      },
      {
        key: 'deliveryTime',
        label: 'Turnaround Time',
        type: 'text',
        placeholder: 'e.g. 24 hours, 3-5 days',
      },
    ],
  },

  // Default fallback for "Other"
  Other: {
    categoryLabel: 'Other',
    icon: '📦',
    fields: [
      {
        key: 'unit',
        label: 'Unit of Sale',
        type: 'text',
        placeholder: 'e.g. per piece, per kg, per set',
      },
      {
        key: 'origin',
        label: 'Made In',
        type: 'text',
        placeholder: 'e.g. Nigeria, China, UK',
      },
    ],
  },
};

// Returns registry for the given category (falls back to Other)
export function getRegistry(category: string): ProductRegistry {
  return PRODUCT_REGISTRIES[category] ?? PRODUCT_REGISTRIES['Other'];
}
