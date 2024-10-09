import React, { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

const style = {
  height: 30,
  border: "1px solid green",
  margin: 6,
  padding: 8
};

const ScrollView = () => {
  // Initialize state using the useState hook
  const [items, setItems] = useState(Array.from({ length: 20 }));

  // Function to fetch more data
  const fetchMoreData = () => {
    // Simulate an async API call that fetches 20 more items after 1.5 seconds
    setTimeout(() => {
      setItems((prevItems) => prevItems.concat(Array.from({ length: 20 })));
    }, 1500);
  };

  return (
    <div>
      <h1>Demo: react-infinite-scroll-component</h1>
      <hr />
      <InfiniteScroll
        dataLength={items.length} // This is important to determine if more data should be loaded
        next={fetchMoreData}      // Function to fetch more data
        hasMore={true}            // Whether there are more items to load
        loader={<h4>Loading...</h4>} // Loader component
      >
        {items.map((_, index) => (
          <div style={style} key={index}>
            div - #{index + 1}
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
};

export default ScrollView;
