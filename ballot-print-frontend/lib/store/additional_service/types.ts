import { CostUnit, WeightUnit } from "../service/types";

export interface AdditionalServiceState {
  [key: string]: PostAdditionalService;
}


export interface PostAdditionalService {
  id: number;
  cost: number;
  value: string;
  key: string;
  name: string;
  label: string;
  description: string;
  fixed_cost: number;
  rate_cost?: number;
  fixed_weight?: number;
  rate_weight?: number;
  weight_limit?: number;
  weight_unit?: WeightUnit;
  cost_unit: CostUnit;
  selectable: boolean;
  selected: boolean;
  created_at?: string;
  updated_at?: string;
}

