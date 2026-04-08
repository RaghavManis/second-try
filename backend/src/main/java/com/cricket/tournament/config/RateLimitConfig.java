package com.cricket.tournament.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.Duration;

@Configuration
public class RateLimitConfig implements WebMvcConfigurer {

    private final java.util.concurrent.ConcurrentHashMap<String, Bucket> publicApiBuckets = new java.util.concurrent.ConcurrentHashMap<>();
    private final java.util.concurrent.ConcurrentHashMap<String, Bucket> adminApiBuckets = new java.util.concurrent.ConcurrentHashMap<>();

    @org.springframework.beans.factory.annotation.Autowired
    private RequestLoggingInterceptor requestLoggingInterceptor;

    private Bucket createPublicBucket() {
        Bandwidth limit = Bandwidth.classic(500, Refill.greedy(500, Duration.ofMinutes(1)));
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket createAdminBucket() {
        Bandwidth limit = Bandwidth.classic(1000, Refill.greedy(1000, Duration.ofMinutes(1)));
        return Bucket.builder().addLimit(limit).build();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Register API Logging Interceptor for all routes
        registry.addInterceptor(requestLoggingInterceptor).addPathPatterns("/api/**");

        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getRemoteAddr();
                } else {
                    // X-Forwarded-For can be a comma-separated list of IPs. The first is the actual client IP.
                    ip = ip.split(",")[0].trim();
                }
                
                if (ip == null) ip = "unknown";
                Bucket bucket;
                if (request.getMethod().equalsIgnoreCase("GET")) {
                    bucket = publicApiBuckets.computeIfAbsent(ip, k -> createPublicBucket());
                } else {
                    bucket = adminApiBuckets.computeIfAbsent(ip, k -> createAdminBucket());
                }

                if (bucket.tryConsume(1)) {
                    return true;
                }

                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("Too many requests - Rate limit exceeded");
                return false;
            }
        }).addPathPatterns("/api/**");
    }
}
