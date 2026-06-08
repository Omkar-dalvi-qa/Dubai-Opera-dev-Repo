"use client";

import { Gift, Trash2 } from "lucide-react";

export interface GiftCardItem {
    id: string;
    codeSuffix: string;
    maskedTail: string;
    expiryLabel: string;
    balance: string;
    currency: string;
}

interface GiftCardProps {
    card: GiftCardItem;
    onDelete?: () => void;
}

export default function GiftCard({ card, onDelete }: GiftCardProps) {
    const title = `Gift Card ${card.maskedTail} ${card.codeSuffix}`;

    return (
        <div className="flex items-center justify-between bg-surface p-4 lg:p-6 rounded-[16px] border border-white/5 transition-all hover:bg-[#151515]">
            <div className="flex items-center gap-4 lg:gap-6">
                <div className="bg-[#444444] h-12 w-16 lg:h-14 lg:w-20 rounded-[8px] flex items-center justify-center shrink-0">
                    <Gift size={28} className="text-white" />
                </div>
                <div>
                    <h3 className="font-montserrat font-bold text-white text-[16px] lg:text-[18px]">
                        {title}
                    </h3>
                    <p className="font-montserrat text-white/50 text-[13px] lg:text-[14px] mt-1">
                        Expires {card.expiryLabel}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden lg:block bg-[#1a1a1a] border border-white/5 px-6 py-2 rounded-[12px] text-right">
                    <p className="text-white/50 text-[11px] uppercase font-montserrat tracking-wider">Available Balance</p>
                    <p className="text-white font-bold font-montserrat text-[16px]">{card.currency} {card.balance}</p>
                </div>
                {/* <button
                    onClick={onDelete}
                    className="text-white/30 hover:text-white/60 transition-colors p-2"
                    aria-label={`Remove gift card ${card.id}`}
                >
                    <Trash2 size={20} />
                </button> */}
            </div>
        </div>
    );
}
