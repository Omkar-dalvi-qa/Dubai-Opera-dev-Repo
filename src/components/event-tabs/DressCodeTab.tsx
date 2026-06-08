import { imageUrl } from "@/utils/imageUrl";
import Image from "next/image";



export default function DressCodeTab({ dressCodeImage = "", dressCodeDescription = "" }: { dressCodeImage: string; dressCodeDescription: string }) {
  const descriptionHtml = (dressCodeDescription ?? "")
    .replaceAll("&nbsp;", " ")
    .replaceAll("\u00A0", " ");
 
  return (
    <div className="text-white">
      <h2 className="font-optima font-normal text-[24px] leading-[32px] md:text-[32px] md:leading-[100%] tracking-normal text-white mb-2 md:mb-6">Dress Code</h2>
      <div className="font-montserrat font-normal text-[14px] leading-[23px] md:text-[16px] md:leading-6 tracking-normal text-white/95 mb-5 lg:mb-10 space-y-3">
        <p className="w-full max-w-full min-w-0 whitespace-normal wrap-anywhere" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
        <Image
          src={`${dressCodeImage ? imageUrl(dressCodeImage) : "/images/fallback.png"}`}
          width={1000}
          height={1000}
          className="rounded-[20px] w-full h-full aspect-video"
          alt="Dress Code"
        />
      </div>
    </div>
  );
}
