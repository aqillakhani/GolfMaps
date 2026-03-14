import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import posterAugusta from "@/assets/poster-augusta.jpg";
import posterPebble from "@/assets/poster-pebble.jpg";
import posterStAndrews from "@/assets/poster-standrews.jpg";
import posterPinehurst from "@/assets/poster-pinehurst.jpg";

const posters = [
  { src: posterAugusta, label: "Augusta National" },
  { src: posterPebble, label: "Pebble Beach" },
  { src: posterStAndrews, label: "St Andrews" },
  { src: posterPinehurst, label: "Pinehurst No. 2" },
];

const PosterCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % posters.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [current]);

  const variants = {
    enter: (dir: number) => ({ x: dir * 100, opacity: 0, scale: 0.9 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir * -100, opacity: 0, scale: 0.9 }),
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative h-full max-h-full" style={{ aspectRatio: "3/4" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <img
              src={posters[current].src}
              alt={posters[current].label}
              className="w-full h-full object-cover rounded-2xl shadow-poster"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PosterCarousel;
