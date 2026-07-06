FROM ubuntu:22.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    g++ cmake make \
    libjsoncpp-dev libssl-dev \
    libboost-dev libboost-system-dev libboost-thread-dev \
    libpq-dev postgresql-client \
    git && \
    rm -rf /var/lib/apt/lists/*

RUN git clone --depth 1 --branch v1.9.0 https://github.com/drogonframework/drogon /tmp/drogon && \
    cd /tmp/drogon && mkdir build && cd build && \
    cmake .. -DCMAKE_BUILD_TYPE=Release && \
    make -j$(nproc) && make install && \
    ldconfig && rm -rf /tmp/drogon

WORKDIR /app
COPY CMakeLists.txt config.json ./
COPY controllers/ ./controllers/
COPY models/ ./models/
COPY services/ ./services/
COPY filters/ ./filters/
COPY main.cc ./

RUN mkdir build && cd build && \
    cmake .. -DCMAKE_BUILD_TYPE=Release && \
    make -j$(nproc) && \
    cp study_planner /app/study_planner

FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    libjsoncpp-dev libssl-dev libpq-dev ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/lib /usr/local/lib
COPY --from=builder /app/study_planner /app/study_planner
COPY --from=builder /app/config.json /app/config.json

RUN ldconfig

WORKDIR /app
EXPOSE 8080
CMD ["./study_planner"]
