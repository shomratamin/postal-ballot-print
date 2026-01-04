import { Button, Card, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import { Icon } from '@iconify/react/dist/iconify.js';
import React from 'react';
import { e_to_b } from '@/lib/utils/EnglishNumberToBengali';

interface BulkBookingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lang: string;
  reports: any[];
  data: any;
  totalRecords: number;
  onConfirm: () => void;
  isPending: boolean;
}

const BulkBookingModal = ({ isOpen, onOpenChange, lang, reports, data, totalRecords, onConfirm, isPending }: BulkBookingModalProps) => {
    return (
      <Modal
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        size="2xl"
        placement="top-center"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
            <ModalHeader className="flex flex-col gap-1 bg-primary dark:bg-gray-800 text-white p-4 border-b border-divider">
                <div className="flex items-center gap-3">
                  <Icon icon="lucide:package-check" className="w-6 h-6" />
                  <h2 className="text-xl font-bold text-white">
                    {lang === "bn" ? "বাল্ক বুকিং তথ্য" : "Bulk Booking Information"}
                  </h2>
                </div>
              
              </ModalHeader>
              <ModalBody>
                <div className="space-y-2">
                  {/* User Information */}
                  {reports.length > 0 && (
                    <Card className="p-4">
                      <h3 className="text-lg font-medium mb-3 text-primary rounded">
                        {lang === "bn" ? "ব্যবহারকারীর তথ্য" : "User Information"}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">
                            {lang === "bn" ? "ব্যবহারকারীর নাম:" : "User Name:"}
                          </span>
                          <p className="text-gray-900 dark:text-gray-100">
                            {reports[0]?.User_Name || "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">
                            {lang === "bn" ? "ব্যবহারকারী আইডি:" : "User ID:"}
                          </span>
                          <p className="text-gray-900 dark:text-gray-100">
                            {reports[0]?.Sender_ID || "N/A"}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-600 dark:text-gray-400">
                            {lang === "bn" ? "ব্যবহারকারীর ঠিকানা:" : "User Address:"}
                          </span>
                          <p className="text-gray-900 dark:text-gray-100">
                            {reports[0]?.ben_address || "N/A"}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Service Information */}
                  <Card className="p-4">
                    <h3 className="text-lg font-medium mb-3 text-primary rounded">
                      {lang === "bn" ? "সেবার তথ্য" : "Service Information"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          {lang === "bn" ? "সেবার ধরন:" : "Service Type:"}
                        </span>
                        <div className="text-gray-900 dark:text-gray-100">
                          {[...new Set(reports.map(item => item.Service_Type))].join(", ") || "N/A"}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          {lang === "bn" ? "ভ্যাস টাইপ:" : "VAS Type:"}
                        </span>
                        <div className="text-gray-900 dark:text-gray-100">
                          {[...new Set(reports.map(item => item.VAS_Type).filter(Boolean))].join(", ") || "N/A"}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          {lang === "bn" ? "মোট রেকর্ড:" : "Total Records:"}
                        </span>
                        <p className="text-gray-900 dark:text-gray-100 font-semibold">
                          {lang === "bn" ? e_to_b(totalRecords.toString()) : totalRecords}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          {lang === "bn" ? "মোট চার্জ:" : "Total Charge:"}
                        </span>
                        <p className="text-gray-900 dark:text-gray-100 font-semibold">
                          {data?.total_charge_sum ? 
                            `${lang === "bn" ? e_to_b(data.total_charge_sum) : data.total_charge_sum} ৳` 
                            : "N/A"
                          }
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          {lang === "bn" ? "ভিপি সেবার সংখ্যা:" : "VP Service Count:"}
                        </span>
                        <p className="text-gray-900 dark:text-gray-100 font-semibold">
                          {data?.vp_service_count ? 
                            (lang === "bn" ? e_to_b(data.vp_service_count.toString()) : data.vp_service_count)
                            : "0"
                          }
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  {lang === "bn" ? "বন্ধ করুন" : "Cancel"}
                </Button>
                <Button 
                  color="primary" 
                  onPress={() => {
                    onConfirm();
                    onClose();
                  }}
                  isLoading={isPending}
                  disabled={isPending}
                >
                  {lang === "bn" ? "নিশ্চিত করুন" : "Confirm Booking"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    );
};

export default BulkBookingModal;