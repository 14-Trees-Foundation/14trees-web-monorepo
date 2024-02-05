"use client"
/* eslint-disable jsx-a11y/alt-text */
import Image, { StaticImageData } from "next/image";
import { Variants, motion } from "framer-motion";

interface ImageProps {
    src: StaticImageData;
    alt: string;
    className?: string;
    width: number;
    height: number;
}

const variants = {
    hidden: { opacity: 0, x: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.1, duration: 0.4 },
    },
  };


export default function ImageFrame({className, ...props}: ImageProps ) {
    const cls = `mx-auto shadow-md border rounded-md ${className}`;
    return (<motion.div variants={variants}
          initial="hidden"
          animate="visible">
        <Image className={cls} {...props} objectFit="contain"/>
    </motion.div>)
}
