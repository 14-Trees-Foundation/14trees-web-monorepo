/**
 * Animation configurations and variants used across the donate page components
 */

export const containerVariants = {
  hidden: { opacity: 0, y: 10, scale: 1.05 },
  visible: {
    opacity: 1,
    y: 0, 
    scale: 1,
    transition: { duration: 0.5 },
  },
};

// Additional animation variants can be added here as needed
export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

export const slideUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  }
};