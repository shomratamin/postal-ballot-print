"use client";
import * as React from "react";
import { Card, CardBody } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import { Icon } from "@iconify/react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button, Badge, Input, Spacer, Tooltip } from "@heroui/react";
import Cookies from "js-cookie";
import { VerifiedUser } from "@/lib/utils/verifyCookie";
import { useUserInfoUpdate } from "@/lib/hooks/useUserInfoUpdate";
import { UserInfoUpdate } from "@/lib/store/user/types";
import { Branch } from "@/lib/store/common/types";
import { useUserInfo } from "@/lib/hooks/useUserInfo";
import { useEffect } from "react";
import { ProfileLocale } from "@/dictionaries/types";


interface ProfileSettingCardProps {
  className?: string;
  user: VerifiedUser | null;
  branch: Branch | null;
  profileLocale: ProfileLocale;
}

const ProfileSetting = React.forwardRef<HTMLDivElement, ProfileSettingCardProps>(({ className, user, profileLocale, branch, ...props }, ref) => {
  const token = Cookies.get("access") || "";
  const { mutate } = useUserInfoUpdate();

  const { data: user_info, isLoading, error: userInfoError } = useUserInfo(token);
  console.log("fetched user info in profile setting", user_info);

  const [legalName, setLegalName] = React.useState(user_info?.legal_name || "");
  const [username, setUsername] = React.useState(user_info?.username || "");
  const [phoneNumber, setPhoneNumber] = React.useState(user_info?.phone_number || "");
  const [nidNumber, setNidNumber] = React.useState(user_info?.nid_no || "");
  const [email, setEmail] = React.useState(user_info?.email || "");


  const [loading, setLoading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);


  // user not getting yet as get set above
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);

  useEffect(() => {
    if (user_info) {
      if (user_info.phone_number && user_info.phone_number.startsWith("+88")) {
        setPhoneNumber(user_info.phone_number.slice(3));
      } else {
        setPhoneNumber(user_info.phone_number || "");
      }
      setLegalName(user_info.legal_name || "");
      setUsername(user_info.username || "");
      setNidNumber(user_info.nid_no || "");
      setEmail(user_info.email || "");
      setPreviewImage(`${user_info.avatar}` || null);
    }
  }, [user_info]);

  const userInfo: UserInfoUpdate = {
    token: Cookies.get("access") || "",
    legal_name: legalName,
    username: username || user?.username || "",
    phone_number: phoneNumber,
    nid_no: nidNumber,
    email: email,
    avatar: selectedFile || "",

  };



  const handleUpdateProfile = () => {
    mutate(userInfo, {

      onSuccess: (response) => {
        if (response.status === "200" || response.status === "success") {
          setSuccessMessage(response.message);
          setError(null);
          toast.success(response.message);
        } else {

          setError(response.message);
          setSuccessMessage(null);
          toast.error(response.message);
        }
      },
      onError: (error: any) => {
        console.error("Update Failed:", error);
        setError(error.message);
        setSuccessMessage(null);
        toast.error(error.message);
      },
    });
  };



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
    }
  };



  const handleUpdateProfilePicture = () => {
    fileInputRef.current?.click();
  };




  return (
    <div ref={ref} className={`p-2 ${className}`} {...props}>
      {/* Profile */}
      <div>

        <Card className="mt-4 bg-default-100" shadow="none">
          <CardBody>

            <div className="flex items-center gap-4">

              <Tooltip content="Select a new profile picture" placement="bottom" className="text-postDark dark:text-postLight">

                <Badge
                  classNames={{
                    badge: "w-5 h-5 hover:bg-secondary-700",
                  }}
                  content={
                    <Button
                      isIconOnly
                      className="h-5 w-5 min-w-5 bg-background p-0 text-default-500"
                      radius="full"
                      size="sm"
                      variant="bordered"
                      onClick={handleUpdateProfilePicture}
                    >
                      <Icon className="h-[9px] w-[9px]" icon="solar:pen-linear" />
                    </Button>
                  }
                  placement="bottom-right"
                  shape="circle"
                >
                  <Avatar
                    className="h-20 w-20"
                    src={previewImage || user?.avatar || "/icons/700674.png"}
                  />

                </Badge>
              </Tooltip>




              <div>
                <p className="text-md font-medium text-default-600">
                  {user_info?.username || "Username"}
                </p>
                <p className="text-xs text-default-400">
                  {profileLocale.phone}: {user_info?.phone_number || "Phone number was not provided"}
                </p>
                <p className="text-xs text-default-400">
                  {profileLocale.email}: {user_info?.email || "E-mail was not provided"}
                </p>

                <p className="text-xs text-default-400">
                  {profileLocale.branch}: {branch?.name || "Branch information not available"}
                </p>
                {/* <p className="mt-1 text-xs text-default-400">
                  {user?.phone || "Customer Support"}
                </p> */}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      <Spacer y={4} />
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      {/* Full Name */}
      {/* <div>
        <p className="text-base font-medium text-default-700">Full Name</p>
        <Input
          className="mt-2 placeholder-gray-400"
          placeholder="Enter your full name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          required
        />
      </div> */}
      <Spacer y={2} />
      {/* Legal Name */}
      <div>
        <p className="text-base font-medium text-default-700">{profileLocale.unique_username}</p>
        <Input
          className="mt-2 placeholder-gray-400"
          placeholder="Enter your unique user name"
          value={username || user_info?.username || ""}
          required
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <Spacer y={2} />
      {/* Phone Number */}
      <div>
        <p className="text-base font-medium text-default-700">{profileLocale.phone}</p>
        <Input
          className="mt-2 placeholder-gray-400"
          placeholder="Enter your phone number"
          value={phoneNumber || user_info?.phone_number || ""}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
      </div>
      <div>
        <p className="text-base font-medium text-default-700">{profileLocale.name}</p>
        <Input
          className="mt-2 placeholder-gray-400"
          placeholder="Enter your legal name"
          value={legalName || user_info?.legal_name || ""}
          required
          onChange={(e) => setLegalName(e.target.value)}
        />
      </div>
      <Spacer y={2} />
      {/* NID Number */}
      <div>
        <p className="text-base font-medium text-default-700">{profileLocale.nid_number}</p>
        <Input
          className="mt-2 placeholder-gray-400"
          placeholder="Enter your NID number"
          value={nidNumber || user_info?.nid_no || ""}
          onChange={(e) => setNidNumber(e.target.value)}
          required
        />
      </div>
      <Spacer y={2} />
      {/* Email */}
      <div>
        <p className="text-base font-medium text-default-700">{profileLocale.email}</p>
        <Input
          className="mt-2 placeholder-gray-400"
          placeholder="Enter your email address"
          value={email || user_info?.email || ""}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Spacer y={4} />
      {/* Error and Success Messages */}
      {error && <p className="text-postRed">{error}</p>}
      {successMessage && <p className="text-postGreenLight">{successMessage}</p>}
      {/* Update Profile Button */}
      <Button
        className="mt-4 bg-default-foreground text-background"
        size="sm"
        isDisabled={loading}
        onClick={handleUpdateProfile}
      >
        {loading ? "Updating..." : profileLocale.update_profile}
      </Button>
      <ToastContainer />
    </div>
  );
});

ProfileSetting.displayName = "ProfileSetting";

export default ProfileSetting;

