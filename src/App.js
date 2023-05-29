import { useEffect, useState, useRef, useCallback } from 'react';
import clsx from 'clsx';
import WorkersLogo  from './components/WorkersLogo';
import PagesLogo  from './components/PagesLogo'

const API_BASE_URL = 'https://cf-reader.pdwittig.workers.dev';
const READY = 'ready';
const COMPLETE = 'complete';
const PROCESSING = 'processing';

export default function App() {
  const index = useRef(0);
  const [count, setCount] = useState(0);
  const [words, setWords] = useState([[]]);
  const [status, setStatus]= useState('ready')

  useEffect(() => {
    const fetchCount = async() => {
      const res = await fetch(API_BASE_URL);
      const json = await res.json();
      
      setCount(json.count);
    }

    fetchCount();    
  }, [])

  const start = useCallback(async () => {
    setStatus(PROCESSING)
    const wordsToFetch = Array.from(Array(count).keys());

    const fetchWord = (index) => {
      let end;
      const start = performance.now();
      return fetch(`${API_BASE_URL}/words/${index}`)
        .then(res => {
          end = performance.now()
          return res.json()
        })
        .then(data => ({ index, word: data.word, duration: end - start }))
    }

    const updateWords = word => {
      if (word.index + 1 >= count) {
        setStatus(COMPLETE)
      }

      return setWords(w => {
        if (word.word === '**Break**') return [...w, []]
       
        const last = w.slice(-1).pop();
        const rest = w.slice(0, -1);
          
        return [...rest, [...last, word]]
      })
  };

    await wordsToFetch.reduce((promise, index) => {
      return promise.then(() => fetchWord(index).then(updateWords))
    }, Promise.resolve(null));
  }, [count])

  const averageLatency = useCallback(() => {
    const flat = words.flat()
    return flat.reduce((sum, word) => word.duration + sum, 0) / flat.length
  }, [words])

  const totalRunTime = useCallback(() => {
    const flat = words.flat()
    return flat.reduce((sum, word) => word.duration + sum, 0)
  }, [words])

  return (
    <div className="relative flex w-full h-screen">
      <div className="flex flex-col space-y-6 max-w-5xl mx-auto my-16">
        <h1 className="text-2xl text-gray-800 font-medium mx-auto">How fast are Cloudflare Workers + Workers KV?</h1>
        <button
          onClick={start}
          disabled={status !== READY}
          className="mx-auto px-6 py-3 rounded bg-gray-50 borde border-gray-100 hover:bg-gray-100 text-[#F48120]"
        >
          Let's take a look...
        </button>
        <div className={clsx(

            'flex flex-col space-y-5 mx-auto rounded p-6'
          )}
        >
          {words.map((word, paraIndex) => 
            <p className="w-[50rem] text-left prose text-gray-700 whitespace-pre-wrap">
              {word.map(w => <Word word={w.word} fadeIn={paraIndex !== 0}/>)}
            </p>
          )}
        </div>
        <>
          {
              <div 
                className={clsx(
                  status !== COMPLETE && 'opacity-0',
                  'flex  flex-col space-y-6 transition duration-1000 ease-in'
                )}
              >
                <div className="flex flex-col space-y-2 divide-y divide-gray-100">
                  <h3 className="text-xl font-medium text-gray-800">Analytics</h3>
                  <div className="grid gap-4 grid-cols-3 py-5">
                    <div className="flex flex-col border border-gray-100 rounded shadow-sm py-5">
                      <div className="mx-auto">
                        <p className="text-sm text-gray-500">Requests (Worker + KV)</p>
                        <p className="text-6xl font-medium text-gray-700">{count}</p>              
                      </div>
                    </div>
                    <div className="flex flex-col border border-gray-100 rounded-md shadow-sm py-5">
                      <div className="mx-auto">
                        <p className="text-sm text-gray-500">Average latency</p>
                        <p className="text-6xl font-medium text-gray-700">{Math.round(averageLatency())}<span className="text-2xl font-medium">ms</span></p>            
                      </div>
                    </div>
                    <div className="flex flex-col border border-gray-100 rounded-md shadow-sm py-5">
                      <div className="mx-auto">
                        <p className="text-sm text-gray-500">Total time</p>
                        <p className="text-6xl font-medium text-gray-700">{(totalRunTime() / 1000).toFixed(2)}<span className="text-2xl font-medium">s</span></p>              
                      </div>
                    </div>
                  </div>             
                </div>

                <div className="flex flex-col space-y-1 divid divide-gray-100">
                  <h3 className="text-md font-light text-gray-400">Powered by</h3>
                  <div className="flex space-x-10">
                    <div className="w-40 pt-2">
                      <WorkersLogo />
                    </div>
                    <div className="w-36">
                      <PagesLogo />
                    </div>
                    <div className="w-40 pt-2">
                    </div>
                  </div>
                </div>
              </div>
          }
        </>       
      </div>
    </div>
  );
}

function Word({ word, fadeIn }) {
  const [isNew, setIsNew] = useState(true)

  useEffect(() => {
    if (!fadeIn) return;
    setTimeout(() => setIsNew(false), 500)
  }, [])

  return (
    <span
      className={clsx(
        fadeIn && isNew && 'text-gray-300',
        'transition duration-800 ease-in-out'
      )}
    >{word} </span>
  )
}
