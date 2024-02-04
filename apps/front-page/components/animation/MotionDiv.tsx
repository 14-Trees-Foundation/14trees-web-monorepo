"use client";

import { Variants, motion, HTMLMotionProps } from "framer-motion";
import React, { ReactElement } from "react";

interface MotionDivProprs extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
};

export default function MotionDiv({
    children,
    ...props
}: MotionDivProprs): JSX.Element {
    return (
        <motion.div {...props}>{children}</motion.div>
    );
}