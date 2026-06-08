"use client";

import { useState } from "react";
import Banner from "@/components/programs/Banner";
import PhoneInputField from "@/components/PhoneInputField";
import { MapPin, Phone, Mail } from "lucide-react";
import Select from "react-select";
import Partners from "@/components/Partners";

export default function CareersClient() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    enquiryType: "",
    details: "",
  });
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    enquiryType: "",
    details: "",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name as keyof typeof errors]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleSelectChange = (selectedOption: any) => {
    setFormData({ ...formData, enquiryType: selectedOption?.value || "" });
    if (errors.enquiryType) {
      setErrors({ ...errors, enquiryType: "" });
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (errors.phone) {
      setErrors({ ...errors, phone: "" });
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      enquiryType: "",
      details: "",
      phone: "",
    };

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
      isValid = false;
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
      isValid = false;
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }
    if (!phone) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    } else if (phone.length < 8) {
      newErrors.phone = "Invalid phone number";
      isValid = false;
    }
    if (!formData.enquiryType) {
      newErrors.enquiryType = "Enquiry type is required";
      isValid = false;
    }
    if (!formData.details.trim()) {
      newErrors.details = "Enquiry details are required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log("Submitting:", { ...formData, phone });
      // In a real app we'd trigger an API call here.
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        enquiryType: "",
        details: "",
      });
      setPhone("");
    }
  };

  const enquiryOptions = [
    { value: "general", label: "General" },
    { value: "tickets", label: "Tickets" },
    { value: "press", label: "Press" },
  ];

  return (
    <main>
      <div className="min-h-screen overflow-x-clip bg-[#0B0B0B] text-white relative">
        <Banner
          subtitle=""
          title="CAREERS"
          mediaType="image"
          height="60vh"
          mobileHeight="30vh"
          mediaSrc="/images/AncillaryBg.jpg"
          hideMobileGradient
          showOverlay={false}
        />
        </div>

      <Partners />
    </main>
  );
}

