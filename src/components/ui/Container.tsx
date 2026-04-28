import React from 'react'

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize
  as?: keyof JSX.IntrinsicElements
}

const sizeMap: Record<ContainerSize, string> = {
  sm:   'max-w-3xl',
  md:   'max-w-5xl',
  lg:   'max-w-7xl',
  xl:   'max-w-[88rem]',
  full: 'max-w-none',
}

const Container: React.FC<ContainerProps> = ({
  size = 'lg',
  as: Tag = 'div',
  className = '',
  children,
  ...rest
}) => {
  const Component = Tag as React.ElementType
  return (
    <Component
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${sizeMap[size]} ${className}`}
      {...rest}
    >
      {children}
    </Component>
  )
}

export default Container
