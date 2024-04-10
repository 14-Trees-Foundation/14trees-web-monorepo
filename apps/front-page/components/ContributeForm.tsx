"use client";

import {
  Contribution,
  Donor,
  ContributeRequest,
  PaymentOrder,
  VerificationResponse,
  Project,
} from "schema";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useEffect, useState } from "react";
import { Modal } from "ui";
import api from "~/api";
import NumTreesSelector from "./Partials/NumTreesSelector";
import OrderSummary from "./OrderSummary";
import { ThankYou } from "./Partials/ThankYou";
import MotionDiv from "./animation/MotionDiv";
import FormImpl from "./Contribute2";
import { Variants } from "framer-motion";

const ContributeForm = ({
  orderId,
  project,
}: {
  orderId?: string;
  project?: Project;
}) => {
  const [pageView, setPageView] = useState<"form" | "summary" | "thank-you">(
    "form"
  );
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [verification, setVerification] = useState<VerificationResponse | null>(null);

  const onFormSubmit = async (data: ContributeRequest) => {
    if (order === null) {
      const response = await api.post<PaymentOrder>("/contributions/", data);
      if (response.status === 201 || response.status === 200) {
        setOrder(response.data);
      }
    }
    setPageView("summary");
  };

  const onPaymentComplete = (response: VerificationResponse) => {
    setVerification(response);
    if (response.status === "success") {
      setPageView("thank-you");
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 10, scale: 1.05 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <>
      <Modal
        title={<h1 className="text-3xl">Confirmation</h1>}
        show={pageView === "summary"}
        onClose={() => setPageView("form")}
        panelClass="rounded-lg"
      >
        {order && <OrderSummary
          contributionOrder={order}
          onPaymentComplete={onPaymentComplete}
        />}
      </Modal>
      <Modal
        title={
          <h1 className="text-2xl font-light">
            Thank you for your contribution
          </h1>
        }
        show={pageView === "thank-you"}
        onClose={() => {}}
        panelClass="rounded-lg"
      >
        {pageView === "thank-you" && verification?.status === "success" && (
          <div className="p-2">
            { order && <ThankYou emailSent={verification?.emailSent} donor={order.donor} /> }
          </div>
        )}
      </Modal>
      <MotionDiv variants={formVariants}>
        <FormImpl onSubmit={onFormSubmit}/>
        {/* <FormComponent
          onFormSubmit={onFormSubmit}
          onPaymentComplete={onPaymentComplete}
          project={project?.id || "default"}
        /> */}
      </MotionDiv>
    </>
  );
};

type FormProps = {
  onFormSubmit: (data: ContributeRequest) => void;
  onPaymentComplete: (response: VerificationResponse) => void;
  project: Project["id"];
};

const FormComponent = ({ onFormSubmit, onPaymentComplete, project }: FormProps) => {
  const [page, setPage] = useState<
    "user-details" | "contribution" | "contribution-details"
  >("user-details");
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<{ contribution: Contribution; donor: Donor }>({
    defaultValues: {
      contribution: {
        campaign: project,
        emailSent: false,
        plantation: "foundation",
        purpose: "reforestation",
        order: {
          currency: "INR",
        },
      },
      donor: {
        comms: {
          updates: true,
          visit: false,
          volunteer: false,
        },
      },
    },
  });

  const OtherDetailsSection = () => {
    return (
      <>
        <div className="mt-8 flex flex-row content-center justify-center gap-6">
          <div className="mb-2 flex items-center">
            <input
              id="visit"
              className="input-checkbox"
              {...register("donor.comms.visit")}
              type="checkbox"
            />
            <label
              htmlFor="visit"
              className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
            >
              Visit
            </label>
          </div>

          <div className="mb-2 flex items-center">
            <input
              id="volunteer"
              className="input-checkbox"
              {...register("donor.comms.volunteer")}
              type="checkbox"
            />
            <label
              htmlFor="volunteer"
              className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
            >
              Volunteer
            </label>
          </div>

          <div className="mb-2 flex items-center">
            <input
              id="updates"
              className="input-checkbox"
              {...register("donor.comms.updates")}
              type="checkbox"
            />
            <label
              htmlFor="updates"
              className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
            >
              Sign up for updates
            </label>
          </div>
        </div>
      </>
    );
  };
  const UserDetailsPage = () => {
    return (
      <>
        <div className="border-b pb-8">
          <h2 className="form-heading text-center lg:text-left">
            Contact Details
          </h2>
          <div className="">
            <div>
              {/* Donor Fields */}
              <label className="form-input-label">
                <div className="form-input-label-text">First Name</div>
                <input
                  className="form-input"
                  {...register("donor.first_name")}
                  required
                />
              </label>
              {errors.donor?.first_name && (
                <p>{errors.donor.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="form-input-label">
                <div className="form-input-label-text">Last Name</div>
                <input
                  className="form-input"
                  {...register("donor.last_name")}
                />
              </label>
              {errors.donor?.last_name && (
                <p>{errors.donor.last_name.message}</p>
              )}
            </div>
            <div>
              <label className="form-input-label">
                <div className="form-input-label-text">Email</div>
                <input
                  className="form-input"
                  {...register("donor.email_id")}
                  type="email"
                />
              </label>
              {errors.donor?.email_id && <p>{errors.donor.email_id.message}</p>}
            </div>
            <div>
              <label className="form-input-label">
                <div className="form-input-label-text">Phone</div>
                <input className="form-input" {...register("donor.phone")} />
              </label>
              {errors.donor?.phone && <p>{errors.donor.phone.message}</p>}
            </div>
            <div>
              <label className="form-input-label">
                <div className="form-input-label-text">Pan</div>
                <input
                  className="form-input"
                  {...(register("donor.pan"),
                  { pattern: "[A-Z]{5}[0-9]{4}[A-Z]{1}" })}
                />
              </label>
              {errors.donor?.pan && <p>{errors.donor.pan.message}</p>}
            </div>
            {/* <div>
              <label className="form-input-label">
                  <div className="form-input-label-text">Currency</div>
                  <input className="form-input" {...register('donor.currency')} />
              </label>
              {errors.donor?.currency && <p>{errors.donor.currency.message}</p>}
          </div> */}
          </div>
        </div>
      </>
    );
  };

  const ContributionPage = () => {
    return (
      <>
        {/* Contribution Fields */}
        {/* <label className="form-input-label" htmlFor="orderId">
      Order ID:
      <input className="form-input" {...register('contribution.orderId')} id="orderId" />
  </label>
  {errors.contribution?.orderId && <p>{errors.contribution.orderId.message}</p>} */}
        <div className="mt-8">
          <h2 className="form-heading">Contribution</h2>
          <NumTreesSelector
            onChange={(trees, type, notes) => {
              setValue("contribution.order.trees", trees);
              setValue("contribution.order.type", type);
              setValue("contribution.order.notes", notes);
            }}
          />
          <div className="grid-cols-2 gap-2 sm:grid">
            <div>
              {/* <label className="form-input-label" htmlFor="campaign">
                  Campaign:
                  <select className="form-input" {...register('contribution.campaign')} id="campaign">
                      {campaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
                  </select>
              </label> */}
              {/* <Controller
                control={control}
                name="contribution.campaign"
                render={({ field: { onChange, value } }) => (
                  <Select
                    options={campaigns}
                    value={value}
                    label="Campaign"
                    onChange={onChange}
                  />
                )}
              />
              {errors.contribution?.campaign && (
                <p>{errors.contribution.campaign.message}</p>
              )} */}
            </div>

            {/* <div>
              <label className="form-input-label" htmlFor="assignment_names">
                  Assign to:
                  <input className="form-input" {...register('contribution.assignment_names.0')} id="assignment_names" />
              </label>
              {errors.contribution?.assignment_names && <p>{errors.contribution.assignment_names.message}</p>}
          </div> */}
          </div>
        </div>
      </>
    );
  };

  const ContributionDetailsPage = () => {
    return <></>;
  };

  const contri_type = useWatch({
    control,
    name: "contribution.order.type",
  });
  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      {/* {page === "user-details" && <UserDetailsPage />}
      {page === "contribution" && <ContributionPage />}
      {page === "contribution-details" && <ContributionDetailsPage />} */}
      <UserDetailsPage />
      <ContributionPage />
      <ContributionDetailsPage />

      <div className="mt-10 inline-flex w-full items-center">
        <button
          type="submit"
          className="btn-action mx-auto w-full bg-green-700 text-white duration-300 hover:bg-green-600 dark:bg-green-800"
        >
          Continue
        </button>
      </div>
    </form>
  );
};

export default ContributeForm;
