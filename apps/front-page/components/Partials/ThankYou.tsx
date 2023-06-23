import Link from "next/link";
import Image from "next/image";
import logo from "~/assets/images/logo.png";
import { Contribution, Donor } from "schema";

export const ThankYou = ({emailSent, donor}: {donor: Donor, emailSent: boolean}) => {
    return (
      <>
        <div>
          {/* <span className="text-dark-500 text-lg italic">
                Thank you for your contribution.
            </span> */}
          <br />
          <div className="mb-8 mt-24 px-12">
            <Image
              width={200}
              height={200}
              alt="14Trees Logo"
              src={logo}
              className="max-w-32 object-fit mx-auto w-1/3"
            />
          </div>
        </div>
        <div className="bg-white text-center">
          <div className="mx-auto px-2 py-4 lg:items-center lg:justify-between lg:px-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              <span className="block">Thank you for your contribution</span>
              <span className="block text-green-600">You are awesome!</span>
            </h2>
            {emailSent && (
              <div className="mt-12 text-dark-500 text-lg italic text-left">
                The receipt for this transaction has been sent to{" "}
                <span className="text-blue-700">{donor.email_id}.</span>{" "}
              </div>
            )}
            <div className="mt-4 flex lg:flex-shrink-0 text-left">
              <div className="flex-grow">
                You can view the progress of your trees on the dashboard.
              </div>
              <div className="ml-3">
                <Link href={`dashboard.14trees.org/ww/${donor.email_id}`}>
                  <p className="whitespace-nowrap rounded-md shadow border border-transparent bg-green-600 px-5 py-3 text-base font-medium text-white hover:bg-green-700">
                    Open Dashboard
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
};