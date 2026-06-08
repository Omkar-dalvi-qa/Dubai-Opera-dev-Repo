// "use client";

// import { useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { toast } from "sonner";
// import {
//   getExternalRemoveGiftCard,
//   getExternalGiftCardsByUser,
//   postExternalGiftCardVerifyPin,
//   type ExternalGiftCardItem,
// } from "@/services/externalEventOfferClient";
// import { getExternalEventReservationbyId } from "@/services/externalEventReservationClient";
// import { useExternalEventBookingState } from "@/contexts/program-event/ExternalEventDetailsContext";
// import { Loader2 } from "lucide-react";

// type GiftCardItem = {
//   id: string;
//   number: string;
//   amount: number;
//   expiresAt?: string | null;
// };

// export default function BookingGiftCardSection(
  
// ) {
//   const params = useParams<{ locale?: string }>();
//   const locale = params?.locale || "en";

//   const router = useRouter();
//   const { reservationId, customer, shipping, setReservationSummary } = useExternalEventBookingState();
//   const [activeTab, setActiveTab] = useState<"have" | "dontHave">("have");
//   // const getOnlyPhoneNumber = () => {
//   //   const phoneNumber = String(customer.mobile || "").trim();
//   //   return phoneNumber.replace(/^\+\d{1,3}[\s-]*/, "");
//   // };
//   const [giftCardValue, setGiftCardValue] = useState("");
//   const [giftCards, setGiftCards] = useState<GiftCardItem[]>([]);
//   const [giftCardNumber, setGiftCardNumber] = useState("");
//   const [giftCardPin, setGiftCardPin] = useState("");
//   const [selectedGiftCardId, setSelectedGiftCardId] = useState<string>("");
//   const [appliedGiftCardId, setAppliedGiftCardId] = useState<string | null>(null);
//   const [redeeming, setRedeeming] = useState(false);
//   const [loadingCards, setLoadingCards] = useState(false);
//   const [removingGiftCard, setRemovingGiftCard] = useState(false);

//   const formatGiftCardNumber = (value: string) => {
//     const digits = value.replace(/\D/g, "").slice(0, 16);
//     return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
//   };

//   const lookup = giftCardValue.trim();
//   const Phone = lookup.replace(/\s+/g, "");
//   const lookupCardNumber = lookup.replace(/\s+/g, "").toUpperCase();
//   const lookupEmail = lookup;

//   const isValidPhone = /^\+?\d{7,15}$/.test(Phone);
//   const isValidlookupCardNumber =
//     lookupCardNumber.length > 0 && /^[A-Z0-9_-]{6,30}$/.test(lookupCardNumber);
//   const isValidlookupEmail =
//     lookupEmail.length > 0 &&
//     /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lookupEmail);

//   const lookupType: "phone" | "card" | "email" | "invalid" = isValidPhone
//     ? "phone"
//     : isValidlookupEmail
//       ? "email"
//       : isValidlookupCardNumber
//         ? "card"
//         : "invalid";

//   const canGetCards = lookupType !== "invalid";

//   const refreshReservationSummary = async (reservation_id: string | null) => {
//     if (reservation_id == null || String(reservation_id).trim().length === 0) return;
//     const refreshed = await getExternalEventReservationbyId(reservation_id).catch(() => null);
//     const refreshedData = (refreshed?.data as any) ?? null;
//     const refreshedSummary = refreshedData?.summary;
//     if (refreshedSummary && typeof refreshedSummary === "object") {
//       setReservationSummary({
//         ...refreshedSummary,
//         ...(refreshedData?.is_gift_card === true ? { is_gift_card: true } : {}),
//         ...(refreshedData?.gift_card_amount != null
//           ? { gift_card_amount: Number(refreshedData.gift_card_amount) || 0 }
//           : {}),
//       } as any);
//     }
//   };

//   const handleSelectGiftCard = (card: GiftCardItem) => {
//     setSelectedGiftCardId(card.id);
//     setGiftCardNumber(formatGiftCardNumber(card.number));
//     setGiftCardPin("");
//   };

//   const toGiftCardItem = (card: ExternalGiftCardItem): GiftCardItem => {
//     const cardNumber = String(card.card_number ?? "");
//     const amount = Number(card.balance ?? 0);
//     return {
//       id: String(card.id),
//       number: cardNumber,
//       amount: Number.isFinite(amount) ? amount : 0,
//       expiresAt: card.expires_at ?? null,
//     };
//   };

//   const handleGetCards = async () => {
//     if (!canGetCards) {
//       toast.error("Enter a valid phone number, card number, or email.");
//       return;
//     }

//     try {
//       setLoadingCards(true);
//       const giftCardValue = lookup;
//       const response = await getExternalGiftCardsByUser({
//         mobile: giftCardValue,
//         card_number: giftCardValue,
//         email: giftCardValue,
//       });
//       const fetched = Array.isArray(response?.data) ? response.data.map(toGiftCardItem) : [];
//       const sortedData = [...fetched].sort((a, b) => b.amount - a.amount);
//       console.log(sortedData, "sortedData");
//       setGiftCards(sortedData);
//       if (fetched.length === 0) {
//         setSelectedGiftCardId("");
//         setAppliedGiftCardId(null);
//         toast.error("No gift cards found for this phone number.");
//       } else {
//         toast.success("Gift cards fetched successfully.");
//       }
//     } catch (error) {
//       const message = error instanceof Error ? error.message : "Failed to fetch gift cards.";
//       toast.error(message);
//     } finally {
//       setLoadingCards(false);
//     }
//   };

//   const handleRedeem = async () => {
//     if (!giftCardNumber.replace(/\s/g, "") || giftCardPin.length !== 4) return;
//     const reservation_id = String(reservationId ?? "").trim();
//     const card_id = String(selectedGiftCardId).trim();
//     if (String(reservation_id).trim().length === 0) {
//       toast.error("Missing booking details for gift card redeem.");
//       return;
//     }
//     if (String(card_id).trim().length === 0) {
//       toast.error("Select a gift card before redeeming.");
//       return;
//     }

//     try {
//       setRedeeming(true);
//       await postExternalGiftCardVerifyPin({
//         card_id,
//         pin_code: giftCardPin,
//         reservation_id,
//       });
//       await refreshReservationSummary(reservation_id);
//       setAppliedGiftCardId(String(card_id));
//       toast.success("Gift card PIN verified successfully.");
//     } catch (error) {
//       const message = error instanceof Error ? error.message : "Failed to redeem gift card.";
//       toast.error(message);
//     } finally {
//       setRedeeming(false);
//     }
//   };

//   const handleRemoveGiftCard = async () => {
//     const reservation_id = String(reservationId ?? "").trim();
//     const card_id = String(selectedGiftCardId).trim();
//     if (String(reservation_id).trim().length === 0 || String(card_id).trim().length === 0) return;

//     try {
//       setRemovingGiftCard(true);
//       const response = await getExternalRemoveGiftCard({ reservation_id, card_id });
//       const summary = response?.data?.reservation_adjustment?.summary;
//       if (summary && typeof summary === "object") {
//         setReservationSummary(summary);
//       }
//       await refreshReservationSummary(reservation_id);
//       setGiftCardPin("");
//       setSelectedGiftCardId("");
//       setAppliedGiftCardId(null);
//       toast.success(response?.message || "Gift card removed successfully.");
//     } catch (error) {
//       const message = error instanceof Error ? error.message : "Failed to remove gift card.";
//       toast.error(message);
//     } finally {
//       setRemovingGiftCard(false);
//     }
//   };

//   return (
//     <div className="mt-8 hidden">
//       <h2 className="font-optima text-[30px] leading-[36px] lg:text-[44px] mb-4">
//         Gift Card
//       </h2>
//       <div className="space-y-2 rounded-[20px] bg-surface p-5">
//         <div className="mb-3 flex flex-wrap gap-2">
//           <button
//             type="button"
//             onClick={() => setActiveTab("have")}
//             className={`h-10 rounded-[8px] border px-4 font-montserrat text-[13px] font-semibold ${
//               activeTab === "have"
//                 ? "border-primary-light bg-[#7923274D] text-white"
//                 : "border-[#494949] bg-[#151515] text-white/80"
//             }`}
//           >
//             I have a gift card
//           </button>
//           <button
//             type="button"
//             onClick={() => setActiveTab("dontHave")}
//             className={`h-10 rounded-[8px] border px-4 font-montserrat text-[13px] font-semibold ${
//               activeTab === "dontHave"
//                 ? "border-primary-light bg-[#7923274D] text-white"
//                 : "border-[#494949] bg-[#151515] text-white/80"
//             }`}
//           >
//             I don&apos;t have a gift card
//           </button>
//         </div>

//         {activeTab === "have" ? (
//           <>
//             <div className="rounded-[10px] border border-white/15 bg-[#151515] p-3">
//               <div className="grid grid-cols-1 gap-3">
//                 <input
//                   type="text"
//                   value={giftCardValue}
//                   onChange={(event) => setGiftCardValue(event.target.value.slice(0, 80))}
//                   placeholder="Enter phone number, card number, or email"
//                   className="h-11 flex-1 rounded-[8px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white placeholder:text-white/45 focus:outline-none"
//                 />
//               </div>
//               <div className="mt-3 flex items-center justify-between gap-3">
//                 <p className="font-montserrat text-[12px] text-white/60">
//                   Enter one value: phone, card number, or email.
//                 </p>
//                 <button
//                   type="button"
//                   onClick={handleGetCards}
//                   disabled={!canGetCards || loadingCards}
//                   className="h-11 min-w-[120px] cursor-pointer rounded-[10px] bg-primary-light px-5 font-montserrat text-[14px] font-semibold text-white transition-colors hover:bg-[#8e2b30] disabled:cursor-not-allowed disabled:opacity-60"
//                 >
//                   {loadingCards ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Get Cards"}
//                 </button>
//               </div>
//             </div>           
//            <div
//              className={`grid grid-cols-1 gap-3 lg:grid-cols-2 ${
//                giftCards.length > 0 ? "h-[300px] overflow-y-auto" : ""
//              }`}
//            >
//               {giftCards.map((card) => (

//                 <div
//                   key={card.id}
//                   role="button"
//                   tabIndex={0}
//                   onClick={() => handleSelectGiftCard(card)}
//                   onKeyDown={(event) => {
//                     if (event.key === "Enter" || event.key === " ") {
//                       event.preventDefault();
//                       handleSelectGiftCard(card);
//                     }
//                   }}
//                   className={`rounded-[12px] border p-3  text-left transition-colors min-h-[102px] h-fit ${
//                     selectedGiftCardId === card.id
//                       ? "border-primary-light bg-[#7923274D] mb-5"
//                       : "border-white/15 bg-[#151515]"
//                   }`}
//                 >
//                   <p className="font-montserrat text-[12px] text-white/60">Gift Card {card.number}</p>
//                   <p className="mt-1 font-montserrat text-[18px] font-semibold text-white">AED {card.amount}</p>
//                   {card.expiresAt ? (
//                     <p className="mt-1 font-montserrat text-[12px] text-white/70">Expires: {card.expiresAt}</p>
//                   ) : null}
//                   {selectedGiftCardId === card.id ? (
//                     <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
//                       <input
//                         type="password"
//                         value={giftCardPin}
//                         onClick={(event) => event.stopPropagation()}
//                         onChange={(event) => setGiftCardPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
//                         placeholder="Enter 4-digit PIN"
//                         className="h-10 w-full rounded-[8px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[13px] text-white placeholder:text-white/45 focus:outline-none"
//                       />
//                       <button
//                         type="button"
//                         onClick={(event) => {
//                           event.stopPropagation();
//                           void handleRedeem();
//                         }}
//                         disabled={giftCardPin.length !== 4 || redeeming || appliedGiftCardId == card.id}
//                         className="h-10 min-w-[100px] rounded-[8px] bg-primary-light cursor-pointer px-4 font-montserrat text-[13px] font-semibold text-white transition-colors hover:bg-[#8e2b30] disabled:cursor-not-allowed disabled:opacity-60"
//                       >
//                         {redeeming ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Redeem"}
//                       </button>
//                       <button
//                         type="button"
//                         onClick={(event) => {
//                           event.stopPropagation();
//                           void handleRemoveGiftCard();
//                         }}
//                         disabled={removingGiftCard || appliedGiftCardId !== card.id}
//                         className="h-10 min-w-[100px] rounded-[8px] border border-white/20 bg-transparent cursor-pointer px-4 font-montserrat text-[13px] font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
//                       >
//                         {removingGiftCard ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Remove"}
//                       </button>
//                     </div>
//                   ) : null}
//                 </div>
//               ))}
//             </div>
//             {giftCards.length === 0 ? (
//               <p className="font-montserrat text-[13px] text-white text-center">
//                 No gift cards loaded yet. Enter phone number or Card Number or Email and click Get Cards.
//               </p>
//             ) : null}
           
//           </>
//         ) : (
//           <div className="rounded-[10px] border border-white/15 bg-[#151515] p-3">
//             <button
//               type="button"
//               onClick={() => router.push(`/${locale}/shop`)}
//               className="h-11 min-w-[112px] rounded-[10px] bg-primary-light px-5 font-montserrat text-[14px] font-semibold text-white transition-colors hover:bg-[#8e2b30]"
//             >
//               Buy Now
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
