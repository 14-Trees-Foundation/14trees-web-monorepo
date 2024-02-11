"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "ui/components/form";
import { Input } from "ui/components/input";
import { useState } from "react";
import { Checkbox } from "ui/components/checkbox";
import React from "react";
import { ContributeRequest } from "schema";

// Define the Zod schema
const formSchema = z.object({
  contribution: z.object({
    campaign: z.string(),
    plantation: z.enum(["foundation", "public", "farmland"]),
    purpose: z.string(),
    emailSent: z.boolean(),
    assignment_names: z.union([z.string(), z.array(z.string())]).optional(),
  }),
  donor: z.object({
    first_name: z.string(),
    last_name: z.string(),
    pan: z.string(),
    email_id: z.string().email(),
    phone: z.string(),
    comms: z.boolean(),
  }),
});

type FormSchema = z.infer<typeof formSchema>;

type ContributionFormProps = {
  onSubmit: (values: ContributeRequest) => void;
}

const ContributionForm: React.FC<ContributionFormProps> = ({onSubmit}) => {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contribution: {
        campaign: "",
        plantation: "foundation",
        purpose: "",
        emailSent: false,
        assignment_names: "",
      },
      donor: {
        first_name: "",
        last_name: "",
        pan: "",
        email_id: "",
        phone: "",
        comms: true,
      },
    },
  });

  const onFormSubmit = (values: FormSchema) => {
    const contributeRequest: ContributeRequest = {
      contribution: {
        ...values.contribution,
        order: null,
        emailSent: false,
        source: "web",
        assignment_names: values.contribution.assignment_names ? splitIfArray(values.contribution.assignment_names): undefined,
      },
      donor: {
        ...values.donor,
        comms: {
          visit: false,
          volunteer: false,
          updates: values.donor.comms,
        },
      },
    };
    onSubmit(contributeRequest)
  }


  const nextPage = async () => {
    const validateFields: string[] = [];

    // Define the fields to validate for each page
    if (page === 0) {
      // Fields on the first page
      validateFields.push(
        "donor.first_name",
        "donor.last_name",
        "donor.pan",
        "donor.email_id",
        "donor.phone",
        "donor.comms"
      );
    } else if (page === 1) {
      validateFields.push(
        "contribution.campaign",
        "contribution.plantation",
        "contribution.purpose",
        "contribution.assignment_names"
      );
    }

    // Trigger validation for the current page's fields
    const result = await form.trigger(validateFields as any[]);

    // Move to the next page only if the current page's fields are valid
    if (result && page < 1) {
      setPage((prev) => prev + 1);
    }
  };

  const [page, setPage] = useState(0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="">
        {page === 0 && (
          <>
            <FormField
              control={form.control}
              name="donor.first_name"
              key="donor.first_name"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="donor.last_name"
              key="donor.last_name"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="donor.pan"
              key="donor.pan"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>PAN</FormLabel>
                  <FormDescription>
                    We require your PAN to generate an 80g receipt
                  </FormDescription>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="donor.email_id"
              key="donor.email_id"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="donor.phone"
              key="donor.phone"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="donor.comms"
              key="donor.comms"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Comms</FormLabel>
                  <FormControl>
                    <Checkbox {...field} value={field.value ? "true" : "false"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button className="bg-green-700" onClick={nextPage}>Next</Button>
            </div>
          </>
        )}
        {page === 1 && (
          <>
            <FormField
              control={form.control}
              name="contribution.campaign"
              key="contribution.campaign"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Campaign</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contribution.plantation"
              key="contribution.plantation"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Plantation</FormLabel>
                  <FormControl>
                    {/* <Input as="select" {...field}>
          <option value="foundation">Foundation</option>
          <option value="public">Public</option>
          <option value="farmland">Farmland</option>
        </Input> */}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contribution.purpose"
              key="contribution.purpose"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Purpose</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contribution.assignment_names"
              key="contribution.assignment_names"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>Assignment Names</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button className="bg-gray-200 text-b" variant="outline" onClick={() => setPage(0)}>Back</Button>
              <Button className="bg-green-700" type="submit">Submit</Button>
            </div>
          </>
        )}
      </form>
    </Form>
  );
};

export default ContributionForm;

function splitIfArray(value: string | string[]) {
  return Array.isArray(value) ? value : value.split(",");
}