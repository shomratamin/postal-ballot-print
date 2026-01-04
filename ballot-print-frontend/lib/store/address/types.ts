
export interface Country {
    id: number;
    name: string;
    bn_name: string;
    code: string;
    description: string;
    zone_id: number;
    status_active: number;
    is_delete: number;
    created_at: string;
    updated_at: string;
}


export interface CountryMap {
    [key: string]: Country;
}



export interface Zone {
    id: number;
    code: string;
    name: string;
    bn_name: string;
    description: string;
    created_at: string;
    updated_at: string;
    status_active: number;
    is_delete: number;
}

export interface ZoneMap {
    [key: string]: Zone;
}



export interface District {
    id: number;
    en_name: string;
    bn_name: string;
}



export interface District {
    id: number;
    en_name: string;
    bn_name: string;
    slug: string;

}



export interface DistrictMap {
    [key: string]: District;
}



export interface Division {
    id: number;
    name: string;
    bn_name: string;
    slug: string;
}



export interface DivisionMap {
    [key: string]: Division;
}


export interface PoliceStation {
    id: number;
    en_name: string;
    bn_name: string;
    slug: string;
}


export interface PoliceStationMap {
    [key: string]: PoliceStation;
}



export interface PostOffice {
    id: number;
    en_name: string;
    bn_name: string;
    slug: string;
    code: number;
}


export interface PostOfficeMap {
    [key: string]: PostOffice;
}

export interface DistrictResponse {
    status: string;
    message: string;
    data: District | null
}
