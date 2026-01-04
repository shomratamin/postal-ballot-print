import { getDictionary } from "@/dictionaries/dictionaty";
import { get_steps } from "@/lib/store/step/store";
import { get_lang_cookie } from "@/lib/store/user/actions";
import NavBar from "@/src/components/Navbar";
import MotionDiv from "@/src/components/common/MotionDiv";

export default async function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let lang = await get_lang_cookie();
  const { common, service } = await getDictionary(lang);
  const steps = await get_steps();

  return (
    <>
      <NavBar />
      <div className={`flex justify-center items-center`}>
        <div className="flex ss:w-[100vw] xxs:w-[100vw] xs:w-[450px] sm:w-[500px] md:w-[600px] lg:w-[800px]">
          <div
            className={`flex justify-center items-start w-full p-1 cards-container`}
          >
            <div className="flex justify-center items-start">
              <div className="ss:p-1 ss:w-[100vw] xxs:w-[100vw] xs:w-[450px] sm:w-[500px] md:w-[600px] lg:w-[800px] flex">
                <MotionDiv>{children}</MotionDiv>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
