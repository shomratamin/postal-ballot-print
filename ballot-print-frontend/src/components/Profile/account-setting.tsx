"use client";
import * as React from "react";
import { Input, Button, Spacer } from "@heroui/react";
import { Icon } from "@iconify/react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { usePasswordUpdate } from "@/lib/hooks/useUpdatePassword";
import { ProfileLocale } from "@/dictionaries/types";

const ChangePassword = ({ profileLocale }: { profileLocale: ProfileLocale }) => {

  const { mutate } = usePasswordUpdate();
  // State for password inputs
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  // State for password visibility
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);




  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    mutate(
      { old_password: currentPassword, new_password: newPassword },
      {
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
          setError(error.message);
          setSuccessMessage(null);
          toast.error(error.message);
        },
      }
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-lg text-center font-medium text-default-700">{profileLocale.change_password}</h2>
      <Spacer y={2} />

      <div className="shadow-md rounded-lg p-4" >
        {/* Current Password Input */}
        <div>
          <p className="text-base font-medium text-default-700">{profileLocale.current_password}</p>
          <p className="mt-1 text-sm font-normal text-default-400">{profileLocale.enter_your_current_password}.</p>
          <Input
            className="mt-2"
            type={showCurrentPassword ? "text" : "password"}
            placeholder={profileLocale.current_password}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            endContent={
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="text-default-500 focus:outline-none"
              >
                <Icon icon={showCurrentPassword ? "mdi:eye-off" : "mdi:eye"} />
              </button>
            }
          />
        </div>

        <Spacer y={2} />

        {/* New Password Input */}
        <div>
          <p className="text-base font-medium text-default-700">{profileLocale.new_password}</p>
          <p className="mt-1 text-sm font-normal text-default-400">{profileLocale.enter_your_new_password}</p>
          <Input
            className="mt-2"
            type={showNewPassword ? "text" : "password"}
            placeholder={profileLocale.new_password}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            endContent={
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="text-default-500 focus:outline-none"
              >
                <Icon icon={showNewPassword ? "mdi:eye-off" : "mdi:eye"} />
              </button>
            }
          />
        </div>

        <Spacer y={2} />

        {/* Confirm Password Input */}
        <div>
          <p className="text-base font-medium text-default-700">{profileLocale.confirm_password}</p>
          <p className="mt-1 text-sm font-normal text-default-400">{profileLocale.re_enter_your_new_password}</p>
          <Input
            className="mt-2"
            type={showConfirmPassword ? "text" : "password"}
            placeholder={profileLocale.confirm_password}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            endContent={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-default-500 focus:outline-none"
              >
                <Icon icon={showConfirmPassword ? "mdi:eye-off" : "mdi:eye"} />
              </button>
            }
          />
        </div>

        <Spacer y={4} />

        {/* Error and Success Messages */}
        {error && <p className="text-postRed">{error}</p>}
        {successMessage && <p className="text-postGreenLight">{successMessage}</p>}

        {/* Submit Button */}
        <Button
          className="mt-4 bg-default-foreground text-background"
          size="sm"
          onClick={handleUpdatePassword}
        >
          {profileLocale.update_password}
        </Button>
      </div>

      <ToastContainer />
    </div>
  );
};

export default ChangePassword;
