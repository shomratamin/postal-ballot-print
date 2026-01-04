

export enum ResponseStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  PENDING = "PENDING",
  TIMEOUT = "TIMEOUT",
  ERROR = "ERROR"
}


export interface User {
  id: string;
  uuid: string;
  username: string;
  phone: string;
  phone_verified: boolean;
  email: string;
  email_verified: boolean;
  email_verified_at: string;
  created_at: string;
  updated_at: string;
  user_type: number;
  authenticated: boolean;
  permissions: any
}
export interface UserInfoUpdate {
  token: string;
  legal_name: string;
  first_name?: string;
  last_name?: string;
  username: string;
  nid_no: string;
  email: string;
  phone_number: string;
  avatar: string | File;
}


export interface UserInfoData {
  id: string;
  uuid: string;
  avatar: string;
  email: string;
  username: string;
  phone_number: string;
  legal_name: string;
  nid_no: string;
}
export interface UserInfoUpdateResponse {
  message: string;
  status: string;
}


export interface UserPasswordUpdate {
  old_password: string;
  new_password: string;


}
export interface ServiceTokenResponse {
  redirect_token: string;
}
export interface ServiceTokenRequest {
  internal_identifier: string;
  redirect_url: string;
  user_type?: string
}




export interface UserLogoutResponse {
  status: string,
}
export interface UserLoginResponse {
  status: string,
  sso_access_token: string;
  sso_refresh_token: string;
  rms_code: string;
  branch_code: string;
  user_group: string;
  user: User | null;
}




export enum UserDevice {
  MOBILE = "MOBILE",
  TABLET = "TABLET",
  DESKTOP = "DESKTOP",
}



export interface UserSignupResponse {
  status: string,
  message: string;
  data: UserRegisterOTPResponse | null;
}


export interface UserVerifyOTPResponse {
  status: string,
  message: string;
  data: UserVerifyResponse | null;
}



export interface UserState {
  user: User;
  token: string;
  error: string;
  loading: boolean;
  authenticated: boolean;
  temp: TempCredentials;
}


export interface TempCredentials {
  phone: string;
  password: string;
  repassword: string;
}

export interface UserLoginData {

  phone_number: string;
  password: string;
}
export interface UserForgetPasswordData {
  phone: string;
}

export interface UserNidUpdateData {
  user: User;
  formData: FormData;
}

export interface UserRegisterData {
  phone: string;
  password: string;
}

export interface UserRegisterOtpData {
  phone: string;
  password: string;
  repassword: string;
}

export interface UserForgetPassword {
  phone: string;
}
export interface changePasswordForm {
  phone: string;
  otp: string;
  password: string;
  password_confirmation: string;

}

export interface UserForgetPasswordResponse {
  status: string;
  message: string,
  data: UserVerifyResponse | null;

}

export interface UserRegisterResponse {

  user: User;
  token: string;
  status: ResponseStatus;
  error: string;

}
export interface changePasswordFormResponse {
  message: string;
  status: string;
  error: string;
}

export interface UserRegisterOTPResponse {
  message: string;
  status: string;
  code: string;
}

// export interface UserVerifyOtpData {
//   phone: string;
//   otp: string;
//   password: string;
//   repassword: string;

// }
export interface UserVerifyOtpData {
  phone: string;
  otp: string;


}

export interface UserVerifyResponse {
  user: User;
  token: string;
  message: string;
  verified: boolean;
}


export interface UserVerifyOTPResponse {
  status: string,
  message: string;
  data: UserVerifyResponse | null;
}
