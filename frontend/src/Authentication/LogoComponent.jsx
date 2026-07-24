import React from 'react'
import { anticipate, motion, scale } from "motion/react";

const LogoComponent = ({login}) => {
    const AnimatedImage = ({ src, delay }) => (
          <motion.img 
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.1, 1.0] }}
            transition={{ duration: 0.8, delay }}
            drag
            dragSnapToOrigin
            src={src}
            alt="doc-img"
            className="aspect-square h-full object-contain"
          />
        );
  return (
    <div>
        {login?(
            <>
                <motion.div className='h-1/6 text-zinc-900 text-8xl p-2 flex justify-end mb-6'>
                    <motion.h1
                    whileHover={{
                        scale:1.1,
                        color: '#D946EF'
                    }}>docs.
                    </motion.h1>
                </motion.div>
            </>)
        :(
            <>
                <motion.div className='h-1/6 text-zinc-900 text-8xl p-2 flex justify-start mb-6'>
                    <motion.h1
                    whileHover={{
                        scale:1.1,
                        color: '#D946EF'
                    }}>docs.
                    </motion.h1>
                </motion.div>
            </>
        )}
        <motion.div 
        animate={{ x: login ? -50 : 25 }}
        className='h-[90vh] w-full'>
            <motion.div className='h-1/5 w-full  flex items-center justify-center gap-28 mb-4'>
                <AnimatedImage src="/images/8.png" delay={0} />
                <AnimatedImage src="/images/5.png" delay={0.2} />
            </motion.div>
            <motion.div className='h-1/5 w-full flex items-center justify-center gap-24 lg:gap-14 '>
                <AnimatedImage src="/images/7.png" delay={0.4} />
                <AnimatedImage src="/images/1.png" delay={0.6} />
                <AnimatedImage src="/images/6.png" delay={0.8} />
            </motion.div>
            <motion.div className='h-1/5 w-full flex items-center justify-center gap-28'>
                <AnimatedImage src="/images/3.png" delay={1} />
            </motion.div>
            <motion.div className='h-1/5 w-full flex items-center justify-center gap-28 '>
                <AnimatedImage src="/images/2.png" delay={1.2} />
                <AnimatedImage src="/images/4.png" delay={1.4} />
            </motion.div>
        </motion.div>
    </div>
  )
}

export default LogoComponent