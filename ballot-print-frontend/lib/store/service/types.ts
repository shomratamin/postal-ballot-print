import { ServiceLocale } from "@/dictionaries/types";

export enum WeightUnit {
  KG = "KG",
  G = "G",
}
export enum CostUnit {
  TAKA = "TAKA",
  DOLLAR = "DOLLAR",
}


export interface WeightRange {
  upper: number;
  lower: number;
}
export interface WeightRangeUnit {
  lower: number
  upper: number
  unit: WeightUnit
}

export interface PostServiceInput {
  id: number;
  key: string;
  name: string;
  label: string;
  description: string;
  weight_limit: number;
  weight_unit: WeightUnit;
  type: string;
  created_by: string;
  selectable: boolean;
  selected: boolean;
  items: ServiceItem[]
}

export interface PostService {
  id: number;
  key: string;
  name: string;
  label: string;
  description: string;
  weight_limit: number;
  weight_unit: WeightUnit;
  type: string;
  created_by: string;
  selectable: boolean;
  selected: boolean;
  items: ServiceItemMap;
  temp_cost: number
}

export interface ServiceState {
  [key: string]: PostService;
}

export interface ServiceItemMap {
  [key: string]: ServiceItem;
}


export interface ServiceItem {
  id: number;
  cost: number;

  fixed_cost: number;
  rate_cost: number;
  fixed_weight: number;
  rate_weight: number;

  zone_id: number;
  country_id: number;

  weight_limit: number;
  weight_unit: WeightUnit;
  cost_unit: CostUnit;
  selectable: boolean;
  selected: boolean;
  created_by: string;
}

export const get_service_name = (name: string, serviceLocale: ServiceLocale) => {
  console.log("name", name)
  if (name in serviceLocale) {
    // TypeScript knows that key is a property of ServiceLocale because of the runtime check
    let service_local_name = serviceLocale[name as keyof ServiceLocale]
    return service_local_name
  } else {
    console.warn(`Key "${name}" is not a property of ServiceLocale.`);
    return ""
  }

}

