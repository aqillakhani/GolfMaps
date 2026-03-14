import { Flag, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Course } from "@/data/mockData";
import {
  addToWantToPlay,
  addToPlayed,
  isInBucketList,
  isInPlayed,
  getCourseType,
} from "@/lib/bucketListStorage";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BucketListButtonsProps {
  course: Course;
}

const BucketListButtons = ({ course }: BucketListButtonsProps) => {
  const inBucket = isInBucketList(course.id);
  const inPlayed = isInPlayed(course.id);
  const type = getCourseType(course.id);

  const handleBucketList = () => {
    if (inBucket) return;
    addToWantToPlay({
      courseId: course.id,
      courseName: course.name,
      city: course.city,
      country: course.country,
      type,
    });
    toast("Added to your bucket list");
  };

  const handlePlayed = () => {
    if (inPlayed) return;
    addToPlayed({
      courseId: course.id,
      courseName: course.name,
      city: course.city,
      country: course.country,
      type,
      playedDate: new Date().toISOString(),
    });
    toast("Marked as played");
  };

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleBucketList}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: inBucket ? "#E8F2E8" : "transparent",
            }}
          >
            <Flag
              className="w-4 h-4"
              style={{ color: inBucket ? "#1A5C2A" : "hsl(var(--muted-foreground))" }}
              fill={inBucket ? "#1A5C2A" : "none"}
            />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{inBucket ? "On your bucket list" : "Add to Bucket List"}</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handlePlayed}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: inPlayed ? "#E8F2E8" : "transparent",
            }}
          >
            <CheckCircle
              className="w-4 h-4"
              style={{ color: inPlayed ? "#1A5C2A" : "hsl(var(--muted-foreground))" }}
              fill={inPlayed ? "#E8F2E8" : "none"}
            />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{inPlayed ? "Marked as played" : "Mark as Played"}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default BucketListButtons;
