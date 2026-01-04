
import { PersonType, Person } from "./types"


export const INITIAL_SENDER: Person = {
  id: 0,
  name: "",
  title: "",
  email: "",
  division: "",
  division_id: 0,
  district: "",
  district_id: 0,
  police_station: "",
  police_station_id: 0,
  post_office: "",
  post_office_id: 0,
  country: "",
  country_id: 0,
  zone: "SAARC countries",
  zone_id: 0,
  user_id: 0,
  address: "",
  start_time: {
    date: {
      year: 0,
      month: 0,
      day: 0
    },
    time: {
      hours: 10,
      minutes: 0
    }
  },
  end_time: {
    date: {
      year: 0,
      month: 0,
      day: 0
    },
    time: {
      hours: 17,
      minutes: 0
    }

  },
  phone: "",
  person_type: PersonType["SENDER"],
  created_at: "",
  updated_at: ""
}

export const INITIAL_RECIPIENT: Person = {
  id: 0,
  name: "",
  title: "",
  email: "",
  division: "",
  division_id: 0,
  district: "",
  district_id: 0,
  police_station: "",
  police_station_id: 0,
  post_office: "",
  post_office_id: 0,
  country: "",
  country_id: 0,
  zone: "SAARC countries",
  zone_id: 0,
  user_id: 0,
  address: "",
  start_time: {
    date: {
      year: 0,
      month: 0,
      day: 0
    },
    time: {
      hours: 10,
      minutes: 0
    }

  },
  end_time: {
    date: {
      year: 0,
      month: 0,
      day: 0
    },
    time: {
      hours: 17,
      minutes: 0
    }

  },
  phone: "",
  person_type: PersonType["RECIPIENT"],
  created_at: "",
  updated_at: ""
}


