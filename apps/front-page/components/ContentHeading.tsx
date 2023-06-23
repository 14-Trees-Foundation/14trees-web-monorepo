import React from 'react';
const ContentHeading = ({title, sub}: {title: string, sub: string}) => {
    return <div className="md:my-20 object-center">
        <h2 className="text-center lg:text-5xl font-bold tracking-tight text-4xl leading-12">
            <span>{ title }</span>
        </h2>
        <h3 className="mt-2 text-center md:text-xl text-sm text-grey-600">
            <span>{ sub }</span>
        </h3>
    </div>
}

export default ContentHeading;