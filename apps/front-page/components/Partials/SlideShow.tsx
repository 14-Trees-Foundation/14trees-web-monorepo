import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "ui/components/carousel";
import Image from "next/image";

export default function SlideShow({ slides }) {
    return (
        <Carousel className="mt-20 sm:mx-6">
            <CarouselContent>
            {slides.map((slide, index) => (
                <CarouselItem key={index}>
                <Image
                    src={slide.url}
                    alt={slide.title}
                    className="w-full rounded-md object-cover"
                    width={900}
                    height={600}
                />
                </CarouselItem>
            ))}
            </CarouselContent>
            <div className="hidden sm:block">
            <CarouselPrevious />
            <CarouselNext />
            </div>
        </Carousel>
    );
}