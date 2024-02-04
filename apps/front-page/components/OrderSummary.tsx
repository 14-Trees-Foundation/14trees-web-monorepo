"use client"

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  PaymentOrder,
  RazorpayResponse,
  VerificationResponse,
} from "schema";
import { merge } from "lodash";
import api from "~/api";

export default function OrderSummary({
  contributionOrder,
  onPaymentComplete,
}: {
  contributionOrder: PaymentOrder;
  onPaymentComplete: (response: VerificationResponse) => void;
}) {
  const { contribution, order, donor } = contributionOrder;
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (contribution.order.type !== "one-time") {
    return <></>;
  }

  const sanitize = (str: string) => {
    return str.replace(/<\/?[^>]+(>|$)/g, "");
  };

  const edit = () => {
    // Handle edit order click
  };

  const downloadInvoice = () => {
    // Handle download invoice click
  };

  /*
  {
    "razorpay_payment_id": "pay_LeQVd5FUzoZaAp",
    "razorpay_order_id": "order_LeQVGjzbvwRb3o",
    "razorpay_signature": "a57d83a79d0080a9fd355bab42500d4ffe402f223352424779ff800b72b50791"
  }
  */

  const verifyPayment = async (razorpayResponse: RazorpayResponse) => {
    setProcessing(true);
    const verification = await api.post<VerificationResponse>(
      "contributions/verify",
      { donor, contribution, razorpayResponse }
    );
    if (verification.data?.status === "success") {
      setProcessing(false);
      onPaymentComplete(verification.data);
    }
  };

  const orderLink = "14trees.org/orders/" + order.id;

  const collectPayment = (e) => {
    setProcessing(true);
    e.preventDefault();
    if (contribution.order.type !== "one-time") {
      return;
    }

    // Handle collect paym<button id="rzp-button1">Pay</button>
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      amount: String(contribution.order.amount), // Amount is in currency subunits. Default currency is INR.
      currency: "INR",
      name: "14 Trees Foundation", //your business name
      description: "Contribute to 14 Trees Foundation",
      image:
        "https://14trees.org/assets/static/logo.813b813.a268eec33bec647d19552584bc7557d3.png",
      order_id: order.id,
      handler: function (response) {
        // success
        console.log(response);
        verifyPayment(response);
      },
      prefill: {
        name:
          contributionOrder.donor.first_name +
          " " +
          contributionOrder.donor.last_name,
        email: donor.email_id,
        contact: donor.phone,
      },
      notes: {
        source: "14trees-web",
      },
      theme: {
        color: "#3399cc",
      },
    };
    // @ts-ignore
    var rzp1 = new Razorpay(options);
    rzp1.on("payment.failed", function (response) {
      // alert(response.error.code);
      alert(response.error.description);
      setProcessing(false);
      // alert(response.error.source);
      // alert(response.error.step);
      // alert(response.error.reason);
      // alert(response.error.metadata.order_id);
      // alert(response.error.metadata.payment_id);
    });
    rzp1.open();
  };

  const PaidOrderHeader = () => (
    <div className="flex">
      <div className="flex-grow">
        <div className="flex text-2xl font-normal text-gray-800 md:text-3xl">
          <span className="mr-4">Summary</span>
        </div>
        <p className="text-md w-full font-thin md:text-xl">
          Reference ID :{" "}
          <a className="text-blue-700" href={orderLink}>
            {orderLink.replace("order_", "")}
          </a>
        </p>
      </div>
      <div className="flex">
        <button
          onClick={downloadInvoice}
          className="ml-auto block items-center rounded border transition-shadow duration-200 ease-in-out hover:shadow-md md:pl-4 md:text-xl"
        >
          <span className="hidden text-lg text-gray-700 md:contents md:font-medium">
            Download
          </span>
        </button>
      </div>
    </div>
  );

  const Collect = () => (
    <div className="flex w-full flex-col rounded-b-lg bg-gray-700 p-8 pb-4 text-gray-300 dark:bg-gray-900">
      <div className="flex-grow">
        <h2 className="title-font mb-1 text-lg font-medium text-white">
          Order Summary
        </h2>
        <p className="mb-5 leading-relaxed">
          Please make sure that the details mentioned here are correct.
        </p>
      </div>
      <div className="mb-2 mr-2 mt-12 grid grid-cols-2 gap-2">
        <div className="col-span-1 text-lg">
          <div className="inline-block align-middle">Trees:</div>
        </div>
        {contribution.order.type === "one-time" ? (
          <>
            <div className="col-span-1 flex-grow text-right text-3xl font-light">
              {contribution.order.trees}
            </div>
            <div className="col-span-1 text-lg">Amount:</div>
            <div className="col-span-1 flex-grow text-right text-3xl font-light">
              {contribution.order.currency === "INR" && <span>₹</span>}
              {contribution.order.currency === "USD" && <span>$</span>}
              <span>{contribution.order.amount / 100}</span>
            </div>{" "}
          </>
        ) : (
          <></>
        )}
      </div>
      {/* <div className="relative mb-4">Currency: {currency}</div> */}
      <button
        onClick={collectPayment}
        className={`btn-action mx-auto w-full flex-row bg-green-500 text-white duration-500 hover:bg-green-600 dark:bg-green-600 ${
          processing ? "bg-green-700" : ""
        }`}
      >
        {processing && (
          <svg
            className="animate mr-2 h-6 w-8 animate-spin"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="10px"
              strokeLinecap="round"
              strokeDasharray="170"
              strokeDashoffset="120"
            />
          </svg>
        )}
        <span className="text-md">Proceed to Payment</span>
      </button>
      <p className="mt-3 text-xs text-gray-400 text-opacity-90">
        All payments are processed securely via Razorpay.
      </p>
    </div>
  );

  const ObjectSummary = ({ data }) => {
    return (
      <div className="divide-y divide-gray-200">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between py-4">
            <dt className="text-sm font-medium text-gray-500">{key}</dt>
            <dd className="text-sm text-gray-900">{value}</dd>
          </div>
        ))}
      </div>
    );
  };

  const UnpaidHeader = () => (
    <div className="flex">
      <div className="block">
        <p className="text-md w-full font-thin md:text-xl">
          Reference Number:{" "}
          <a className="text-blue-700" href={orderLink}>
            {orderLink.replace("14trees.org/orders/order_", "")}
          </a>
        </p>
      </div>
      <button
        onClick={edit}
        className="ml-auto block items-center rounded border transition-shadow duration-200 ease-in-out hover:shadow-md md:pl-4 md:text-xl"
      >
        <span className="hidden text-lg text-gray-700 md:contents md:font-medium">
          Edit
        </span>
      </button>
    </div>
  );

  const summaryData = {
    Name:
      contributionOrder.donor.first_name +
      " " +
      contributionOrder.donor.last_name,
    Email: contributionOrder.donor.email_id,
    Phone: contributionOrder.donor.phone,
    Campaign: contributionOrder.contribution.campaign,
    Trees: contribution.order.trees + " Trees",
    Amount: contribution.order.currency + " " + contribution.order.amount / 100,
  };

  return (
    <>
      <div className="mx-auto p-5">
        {contributionOrder.status === "captured" ? (
          <PaidOrderHeader />
        ) : (
          <UnpaidHeader />
        )}
        <div className="my-6 border-t border-gray-300" />
        <ObjectSummary data={summaryData} />
      </div>
      <Collect />
    </>
  );
}
