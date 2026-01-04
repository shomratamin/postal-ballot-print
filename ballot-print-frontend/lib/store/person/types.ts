
import { PostType } from "../post/types";


export enum PersonType {
  SENDER = "SENDER",
  RECIPIENT = "RECIPIENT",
  PICKUP = "PICKUP",
}

export enum AddressType {
  INTERNATIONAL = "INTERNATIONAL",
  DOMESTIC = "DOMESTIC"
}

export interface PersonStoreRequest {
  id?: number;
  name?: string;
  title?: string;
  email?: string;

  division?: string;
  division_id?: number;

  district?: string;
  district_id?: number;
  en_name?: string;

  police_station?: string;
  police_station_id?: number;
  post_office?: string;
  post_office_id?: number;

  country?: string;
  country_id?: number;

  zone?: string;
  zone_id?: number;

  user_id?: string;

  address: string;
  start_time?: DateTimeStamp;
  end_time?: DateTimeStamp;

  phone?: string;
  person_type: PersonType;
  address_type?: AddressType;
}

export interface DateTimeStamp {
  date: {
    year: number;
    month: number;
    day: number;
  };
  time: {
    hours: number;
    minutes: number;
  };
}

export interface Person {
  id: number;
  name?: string;
  title?: string;
  email?: string;
  division?: string;
  division_id?: number;
  district?: string;
  district_id?: number;
  police_station?: string;
  police_station_id?: number;
  post_office?: string;
  post_code?: number;
  post_office_id?: number;
  country?: string;
  country_id?: number;
  zone?: string;
  zone_id?: number;

  user_id?: number;

  address: string;
  start_time?: DateTimeStamp;
  end_time?: DateTimeStamp;

  phone?: string;
  person_type: PersonType;
  address_type?: AddressType;
  created_at?: string,
  updated_at?: string
}
// export interface Person {
//   id: number,
//   name?: string;
//   title?: string;
//   email?: string;

//   division?: string;
//   division_id?: number;

//   district?: string;
//   district_id?: number;

//   police_station?: string;
//   police_station_id?: number;
//   policeStation?:string,
//   policeStationId?:number,
//   en_name?:string;
//   post_office?: string;
//   post_office_id?: number;

//   country?: string;
//   country_id?: number;

//   zone?: string;
//   zone_id?: number;

//   user_id: number;

//   address: string;
//   start_time?: string;
//   end_time?: string;

//   phone?: string;
//   person_type: PersonType;
//   created_at?: string,
//   updated_at?: string
// }

export interface PostUpdatePersonRequest {
  post_id: number;
  step?: string;
  recipient_id?: number;
  sender_id?: number;
}


export interface PersonListResponseWrapper {
  status: string;
  message: string;
  data: Person[] | null
}


export interface PersonResponseWrapper {
  status: string;
  message: string;
  data: Person | null
}



export const address_type_to_post_type = (address_type: AddressType): PostType => {
  switch (address_type) {
    case AddressType["DOMESTIC"]: {
      return PostType["DOMESTIC"]
    }
    case AddressType["INTERNATIONAL"]: {
      return PostType["INTERNATIONAL"]
    }

    default: {
      return PostType["DOMESTIC"]
    }
  }
}

export const post_type_to_address_type = (post_type: PostType): AddressType => {
  switch (post_type) {
    case PostType["DOMESTIC"]: {
      return AddressType["DOMESTIC"]
    }
    case PostType["INTERNATIONAL"]: {
      return AddressType["INTERNATIONAL"]
    }

    default: {
      return AddressType["DOMESTIC"]
    }
  }
}

export const person_type_to_number = (person_type: PersonType): number => {
  switch (person_type) {
    case PersonType["RECIPIENT"]: {
      return 1
    }
    case PersonType["PICKUP"]: {
      return 2
    }
    case PersonType["SENDER"]: {
      return 3
    }
    default: {
      return 0
    }
  }
}
export const number_to_person_type = (person_number: number): PersonType => {
  switch (person_number) {
    case 1: {
      return PersonType["RECIPIENT"]
    }
    case 2: {
      return PersonType["PICKUP"]
    }
    case 3: {
      return PersonType["SENDER"]
    }
    default: {
      return PersonType["RECIPIENT"]
    }
  }
}



export const address_type_to_number = (address_type: AddressType): number => {
  switch (address_type) {
    case AddressType["DOMESTIC"]: {
      return 1
    }
    case AddressType["INTERNATIONAL"]: {
      return 2
    }

    default: {
      return 1
    }
  }
}

export const number_to_address_type = (address_type_number: number): AddressType => {
  switch (address_type_number) {
    case 1: {
      return AddressType["DOMESTIC"]
    }
    case 2: {
      return AddressType["INTERNATIONAL"]
    }

    default: {
      return AddressType["DOMESTIC"]
    }
  }
}
