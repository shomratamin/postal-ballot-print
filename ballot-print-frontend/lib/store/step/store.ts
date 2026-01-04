
import { Step } from "./types"


export const initialStepsState: Step[] = [
  { id: 1, name: 'service', label: 'Service', step: 1, bn_label: "সেবা" },
  { id: 2, name: 'recipient', label: 'Recipient', step: 2, bn_label: "প্রাপক" },
  { id: 3, name: 'finalization', label: 'Finalization', step: 3, bn_label: "চূড়ান্তকরণ" },
  { id: 4, name: 'payment', label: 'Payment', step: 4, bn_label: "পেমেন্ট" },
  { id: 5, name: 'printing', label: 'Printing', step: 5, bn_label: "প্রিন্টিং" },
]

export const get_steps = async () => {
  return initialStepsState
};




