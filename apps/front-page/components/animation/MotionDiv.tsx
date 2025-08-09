"use client";

import { Variants, motion, HTMLMotionProps } from "framer-motion";
import React, { ReactElement } from "react";

interface MotionDivProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
};

export default function MotionDiv({
    children,
    ...props
}: MotionDivProps): JSX.Element {
    return (
        <motion.div {...props}>{children}</motion.div>
    );
}