val jacksonVersion = "2.13.5"

buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.11.0")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.25")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }

    configurations.configureEach {
        resolutionStrategy.force(
            "com.fasterxml.jackson.core:jackson-annotations:$jacksonVersion",
            "com.fasterxml.jackson.core:jackson-core:$jacksonVersion",
            "com.fasterxml.jackson.core:jackson-databind:$jacksonVersion"
        )
    }
}

tasks.register("clean").configure {
    delete("build")
}

