"use client";

import { Check, CreditCard, Trash2 } from "lucide-react";

export type CardBrand = "visa" | "mastercard" | "amex";

export interface SavedPaymentCard {
    id: string;
    type: CardBrand;
    lastFour: string;
    holderName: string;
    expiry: string;
    isDefault: boolean;
}

/** Demo list — replace with API data in the parent. */
export const SAVED_PAYMENT_CARDS: SavedPaymentCard[] = [
    {
        id: "card-1",
        type: "visa",
        lastFour: "4242",
        holderName: "Noure Damaj",
        expiry: "12/25",
        isDefault: true,
    },
    {
        id: "card-2",
        type: "mastercard",
        lastFour: "8888",
        holderName: "Noure Damaj",
        expiry: "08/26",
        isDefault: false,
    },
    {
        id: "card-3",
        type: "amex",
        lastFour: "1234",
        holderName: "Noure Damaj",
        expiry: "03/27",
        isDefault: false,
    },
];

function brandLabel(type: CardBrand): string {
    switch (type) {
        case "visa":
            return "Visa";
        case "mastercard":
            return "Mastercard";
        case "amex":
            return "American Express";
        default:
            return "Card";
    }
}

const brandIconBg: Record<CardBrand, string> = {
    visa: "bg-[#0055FF]",
    mastercard: "bg-[#792327]",
    amex: "bg-[#0055FF]",
};

interface SavedPaymentCardRowProps {
    card: SavedPaymentCard;
    isDefault: boolean;
    onSetDefault: () => void;
    onDelete?: () => void;
}

export default function SavedPaymentCardRow({
    card,
    isDefault,
    onSetDefault,
    onDelete,
}: SavedPaymentCardRowProps) {
    const title = `${brandLabel(card.type)} •••• ${card.lastFour}`;
    const sub = `${card.holderName} • Expires ${card.expiry}`;

    return (
        <div className="flex items-center justify-between bg-surface p-4 lg:p-6 rounded-[16px] border border-white/5 transition-all hover:bg-[#151515]">
            <div className="flex items-center gap-4 lg:gap-6">
                <div className={`${brandIconBg[card.type]} h-12 w-16 lg:h-14 lg:w-20 rounded-[8px] flex items-center justify-center shrink-0`}>
                    <CreditCard size={28} className="text-white" />
                </div>
                <div>
                    <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                        <h3 className="font-montserrat font-bold text-white text-[16px] lg:text-[18px]">
                            {title}
                        </h3>
                        {isDefault && (
                            <span className="inline-flex items-center gap-1 bg-[#222222] border border-white/20 px-2 py-0.5 rounded-md text-[12px] font-medium text-white/70">
                                <Check size={12} />
                                Default
                            </span>
                        )}
                    </div>
                    <p className="font-montserrat text-white/50 text-[13px] lg:text-[14px] mt-1">
                        {sub}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
                {!isDefault && (
                    <button
                        onClick={onSetDefault}
                        className="hidden lg:block bg-[#222222] hover:bg-[#333333] text-white px-4 py-1.5 rounded-[8px] font-montserrat font-semibold text-[13px] border border-white/10 transition-colors"
                    >
                        Set as Default
                    </button>
                )}
                <button
                    onClick={onDelete}
                    className="text-white/30 hover:text-white/60 transition-colors p-2"
                    aria-label={`Remove ${title}`}
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </div>
    );
}
