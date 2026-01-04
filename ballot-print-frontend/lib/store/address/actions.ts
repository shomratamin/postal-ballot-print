
import fetchCountries from "@/lib/http/address/fetchCountries";
import fetchZones from "@/lib/http/address/fetchZones";
import fetchDivisions from "@/lib/http/address/fetchDivisions";
import fetchDistricts from "@/lib/http/address/fetchDistricts";
import fetchPostOffices from "@/lib/http/address/fetchPostOffices";
import fetchPoliceStations from "@/lib/http/address/fetchPoliceStations";

import { arrayToObjectMap } from "../common/actions";
import { Country, CountryMap, DistrictMap, DivisionMap, PoliceStationMap, PostOfficeMap, Zone, ZoneMap } from "./types";

export const get_divisions_map = async (): Promise<DivisionMap> => {
  const divisions_state = await fetchDivisions();
  // // console.log("divisions_state", divisions_state)
  const division_map = await arrayToObjectMap(divisions_state);
  return division_map;
};


export const get_districts_map = async (): Promise<DistrictMap> => {
  const districts_state = await fetchDistricts();
  // // console.log("districts_state", districts_state)
  const district_map = await arrayToObjectMap(districts_state);
  return district_map;
};

export const get_post_offices_map = async (): Promise<PostOfficeMap> => {
  const post_offices_state = await fetchPostOffices();
  // // console.log("post_offices_state", post_offices_state)
  const post_office_map = await arrayToObjectMap(post_offices_state);
  return post_office_map;
};

export const get_police_stations_map = async (): Promise<PoliceStationMap> => {
  const police_stations_state = await fetchPoliceStations();
  // // console.log("police_stations_state", police_stations_state)
  const police_station_map = await arrayToObjectMap(police_stations_state);
  return police_station_map;
};


export const get_zones_map = async (): Promise<Zone[]> => {
  return await fetchZones()
  // const zone_map: ZoneMap = await arrayToObjectMap(zones_state)
  // return zone_map
}


export const get_countries_map = async (): Promise<Country[]> => {
  // // console.log("countries_state action");
  return await fetchCountries();
  // const countries_state = await fetchCountries();
  // // console.log("countries_state", countries_state);
  // const country_map: CountryMap = await arrayToObjectMap(countries_state);
  // return country_map;
};
