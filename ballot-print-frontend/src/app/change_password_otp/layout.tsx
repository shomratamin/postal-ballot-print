import { Locale, getDictionary } from "@/dictionaries/dictionaty";
import { get_steps } from "@/lib/store/step/store";
import { get_lang_cookie } from "@/lib/store/user/actions";
import NavBar from "@/src/components/Navbar";
import MotionDiv from "@/src/components/common/MotionDiv";
import { Card } from "@heroui/react";

export default async function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let lang: Locale = await get_lang_cookie();

  return (
    <>
      <NavBar />
      <div className={`flex justify-center items-center`}>
        <div className="flex ss:w-[100vw] xxs:w-[100vw] xs:w-[450px] sm:w-[500px] md:w-[600px] lg:w-[800px]">
          <div
            className={`flex justify-center items-start relative w-full p-1 cards-container`}
          >
            <div className="flex justify-center items-start">
              <Card
                className="ss:p-1 ss:w-[100vw] xxs:w-[100vw] xs:w-[450px] sm:w-[500px] md:w-[600px] lg:w-[800px]"
                shadow="lg"
              >
                <div className="mt-3">
                  <MotionDiv>{children}</MotionDiv>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
